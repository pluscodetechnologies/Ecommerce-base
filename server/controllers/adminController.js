const { getDB } = require("../config/database");
const logger = require("../config/logger");

class AdminController {
  async getDashboardStats(req, res) {
    try {
      const db = getDB();

      const [totalOrders] = await db.execute(
        "SELECT COUNT(*) as count FROM orders",
      );
      const [totalRevenue] = await db.execute(
        'SELECT SUM(total_amount) as total FROM orders WHERE status IN ("paid", "shipped", "delivered")',
      );
      const [totalProducts] = await db.execute(
        "SELECT COUNT(*) as count FROM products",
      );
      const [totalCustomers] = await db.execute(
        'SELECT COUNT(*) as count FROM users WHERE role = "user"',
      );
      const [recentOrders] = await db.execute(
        "SELECT * FROM orders ORDER BY created_at DESC LIMIT 5",
      );
      const [lowStock] = await db.execute(
        'SELECT * FROM products WHERE stock < 5 AND status = "active" LIMIT 5',
      );
      const [topProducts] = await db.execute(`
                SELECT p.name, SUM(oi.quantity) as sold
                FROM order_items oi
                JOIN products p ON oi.product_id = p.id
                JOIN orders o ON oi.order_id = o.id
                WHERE o.status IN ('paid', 'processing', 'shipped', 'delivered')
                GROUP BY p.id
                ORDER BY sold DESC
                LIMIT 5
            `);

      res.json({
        success: true,
        data: {
          totalOrders: totalOrders[0].count,
          totalRevenue: totalRevenue[0].total || 0,
          totalProducts: totalProducts[0].count,
          totalCustomers: totalCustomers[0].count,
          recentOrders,
          lowStock,
          topProducts,
        },
      });
    } catch (error) {
      logger.error("Erro ao buscar stats:", error);
      res
        .status(500)
        .json({ success: false, message: "Erro ao buscar estatísticas" });
    }
  }

  async getOrders(req, res) {
    try {
      const db = getDB();
      const status = req.query.status || null;
      const includeItems = req.query.include_items === "1";
      const exportCsv = req.query.export === "csv";
      const page = parseInt(req.query.page) || 1;
      const limit = exportCsv ? 9999 : parseInt(req.query.limit) || 20;
      const offset = exportCsv ? 0 : (page - 1) * limit;

      let query = "SELECT * FROM orders";
      const params = [];
      if (status) {
        query += " WHERE status = ?";
        params.push(status);
      }
      query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const [orders] = await db.execute(query, params);

      if (exportCsv) {
        const SEP = ";";
        const escapeStr = (v) => {
          const s = String(v ?? "");
          return s.includes(SEP) || s.includes('"') || s.includes("\n")
            ? `"${s.replace(/"/g, '""')}"`
            : s;
        };
        const fmtMoney = (v) =>
          parseFloat(v || 0)
            .toFixed(2)
            .replace(".", ",");
        const statusLabel = {
          pending: "Aguardando",
          paid: "Pago",
          processing: "Preparando",
          shipped: "Enviado",
          delivered: "Entregue",
          cancelled: "Cancelado",
        };
        const payLabel = {
          checkout_pro: "Mercado Pago",
          pix: "PIX",
          boleto: "Boleto",
          manual: "Manual",
        };

        const headers = [
          "Pedido",
          "Data",
          "Cliente",
          "E-mail",
          "Telefone",
          "CPF",
          "Status",
          "Pagamento",
          "Total (R$)",
          "Frete (R$)",
          "Desconto (R$)",
          "Rastreio",
        ];
        const rows = orders.map((o) =>
          [
            o.order_number,
            new Date(o.created_at).toLocaleDateString("pt-BR"),
            o.customer_name,
            o.customer_email,
            o.customer_phone || "",
            o.customer_document || "",
            statusLabel[o.status] || o.status,
            payLabel[o.payment_method] || o.payment_method || "",
            fmtMoney(o.total_amount),
            fmtMoney(o.shipping_amount),
            fmtMoney(o.discount_amount),
            o.shipping_tracking || "",
          ]
            .map(escapeStr)
            .join(SEP),
        );

        const csv = [headers.join(SEP), ...rows].join("\r\n");
        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="pedidos_${new Date().toISOString().slice(0, 10)}.csv"`,
        );
        return res.send("\uFEFF" + csv);
      }
      const [total] = await db.execute(
        "SELECT COUNT(*) as count FROM orders" +
          (status ? " WHERE status = ?" : ""),
        status ? [status] : [],
      );

      if (includeItems && orders.length > 0) {
        const orderIds = orders.map((o) => o.id);
        const placeholders = orderIds.map(() => "?").join(",");
        const [items] = await db.execute(
          `SELECT order_id, product_name, quantity FROM order_items WHERE order_id IN (${placeholders})`,
          orderIds,
        );
        const itemsByOrder = {};
        items.forEach((item) => {
          if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
          itemsByOrder[item.order_id].push(item);
        });
        orders.forEach((o) => {
          o.items = itemsByOrder[o.id] || [];
        });
      }

      res.json({
        success: true,
        data: {
          orders,
          total: total[0].count,
          page,
          totalPages: Math.ceil(total[0].count / limit),
        },
      });
    } catch (error) {
      logger.error("Erro ao buscar pedidos:", error);
      res
        .status(500)
        .json({ success: false, message: "Erro ao buscar pedidos" });
    }
  }

  async getOrderById(req, res) {
    try {
      const { id } = req.params;
      const db = getDB();

      const [orders] = await db.execute(
        `SELECT id, order_number, status, payment_status, payment_method,
                        customer_name, customer_email, customer_phone,
                        total_amount, shipping_amount, discount_amount,
                        shipping_tracking, shipping_address, created_at, updated_at
                 FROM orders WHERE id = ? LIMIT 1`,
        [id],
      );

      if (!orders.length) {
        return res
          .status(404)
          .json({ success: false, message: "Pedido não encontrado" });
      }

      const [items] = await db.execute(
        `SELECT product_name, quantity, unit_price, total_price,
                        color, size
                 FROM order_items WHERE order_id = ?`,
        [id],
      );

      res.json({ success: true, data: { ...orders[0], items } });
    } catch (error) {
      logger.error("Erro ao buscar pedido:", error);
      res
        .status(500)
        .json({ success: false, message: "Erro ao buscar pedido" });
    }
  }

  async createManualOrder(req, res) {
    try {
      const db = getDB();
      const {
        order_number,
        customer_name,
        total_amount,
        shipping_amount,
        payment_method,
        status,
        items,
      } = req.body;

      if (!customer_name || !total_amount) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Nome do cliente e valor total são obrigatórios",
          });
      }

      const orderNum =
        order_number && order_number.trim()
          ? order_number.trim()
          : "MAN-" + Date.now();
      const itemsSummary =
        items && items.length > 0
          ? items
              .filter((i) => i.product_name)
              .map(
                (i) =>
                  `${i.product_name}${i.quantity > 1 ? " x" + i.quantity : ""}`,
              )
              .join(", ")
          : "";
      const shippingAddress = JSON.stringify({
        name: customer_name,
        items_manual: itemsSummary,
      });

      const [result] = await db.execute(
        `INSERT INTO orders (order_number, user_id, customer_name, customer_email, customer_phone, customer_document, total_amount, shipping_amount, discount_amount, payment_method, shipping_address, status, created_at) VALUES (?, NULL, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, NOW())`,
        [
          orderNum,
          customer_name,
          "manual@velvetatelier.com",
          "",
          "",
          parseFloat(total_amount) || 0,
          parseFloat(shipping_amount) || 0,
          payment_method || "manual",
          shippingAddress,
          status || "pending",
        ],
      );

      const orderId = result.insertId;

      if (items && items.length > 0) {
        for (const item of items) {
          if (!item.product_name || !item.product_id) continue;
          await db.execute(
            `INSERT INTO order_items (order_id, product_id, product_name, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?)`,
            [
              orderId,
              item.product_id,
              item.product_name,
              parseInt(item.quantity) || 1,
              parseFloat(item.unit_price) || 0,
              parseFloat(item.unit_price) * (parseInt(item.quantity) || 1),
            ],
          );
        }
      }

      res
        .status(201)
        .json({
          success: true,
          message: "Pedido criado com sucesso",
          data: { id: orderId, order_number: orderNum },
        });
    } catch (error) {
      logger.error("Erro ao criar pedido manual:", error);
      res
        .status(500)
        .json({
          success: false,
          message: "Erro ao criar pedido: " + error.message,
        });
    }
  }

  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, tracking_code } = req.body;
      const db = getDB();

      if (tracking_code) {
        await db.execute(
          "UPDATE orders SET status = ?, shipping_tracking = ? WHERE id = ?",
          [status, tracking_code.trim().toUpperCase(), id],
        );
      } else {
        await db.execute("UPDATE orders SET status = ? WHERE id = ?", [
          status,
          id,
        ]);
      }

      if (status === "shipped") {
        try {
          const [rows] = await db.execute(
            "SELECT order_number, customer_name, customer_email, shipping_tracking FROM orders WHERE id = ?",
            [id],
          );
          if (rows.length && rows[0].customer_email) {
            const {
              sendOrderShippedEmail,
            } = require("../services/emailService");
            sendOrderShippedEmail(rows[0].customer_email, {
              order_number: rows[0].order_number,
              customer_name: rows[0].customer_name,
              shipping_tracking: tracking_code || rows[0].shipping_tracking,
            }).catch((err) =>
              logger.error("[email] pedido enviado falhou:", err),
            );
          }
        } catch (emailErr) {
          logger.error("[email] erro ao enviar email de envio:", emailErr);
        }
      }

      if (status === "delivered") {
        try {
          const [rows] = await db.execute(
            "SELECT order_number, customer_name, customer_email FROM orders WHERE id = ?",
            [id],
          );
          if (rows.length && rows[0].customer_email) {
            const { sendOrderDeliveredEmail } = require("../services/emailService");
            sendOrderDeliveredEmail(rows[0].customer_email, {
              order_number: rows[0].order_number,
              customer_name: rows[0].customer_name,
            }).catch((err) => logger.error("[email] pedido entregue falhou:", err));
          }
        } catch (emailErr) {
          logger.error("[email] erro ao enviar email de entrega:", emailErr);
        }
      }

      if (status === "cancelled") {
        try {
          const [rows] = await db.execute(
            "SELECT order_number, customer_name, customer_email, total_amount FROM orders WHERE id = ?",
            [id],
          );
          if (rows.length && rows[0].customer_email) {
            const { sendOrderCancelledEmail } = require("../services/emailService");
            sendOrderCancelledEmail(rows[0].customer_email, {
              order_number: rows[0].order_number,
              customer_name: rows[0].customer_name,
              total_amount: rows[0].total_amount,
            }).catch((err) => logger.error("[email] pedido cancelado falhou:", err));
          }
        } catch (emailErr) {
          logger.error("[email] erro ao enviar email de cancelamento:", emailErr);
        }
      }

      res.json({ success: true, message: "Status atualizado com sucesso" });
    } catch (error) {
      logger.error("Erro ao atualizar status:", error);
      res
        .status(500)
        .json({ success: false, message: "Erro ao atualizar status" });
    }
  }

  async getProducts(req, res) {
    try {
      const db = getDB();
      const category = req.query.category || null;
      const search = req.query.search || null;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      let query = `
                SELECT p.*, c.name as category_name,
                       (SELECT image_url FROM product_images WHERE product_id = p.id AND is_main = 1 LIMIT 1) as main_image
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE 1=1
            `;
      const params = [];

      if (category) {
        query += " AND p.category_id = ?";
        params.push(category);
      }

      if (search) {
        query += " AND (p.name LIKE ? OR p.sku LIKE ?)";
        params.push(`%${search}%`, `%${search}%`);
      }

      query += " ORDER BY p.created_at DESC LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const [products] = await db.execute(query, params);
      const [total] = await db.execute(
        "SELECT COUNT(*) as count FROM products",
      );

      res.json({
        success: true,
        data: {
          products,
          total: total[0].count,
          page: page,
          totalPages: Math.ceil(total[0].count / limit),
        },
      });
    } catch (error) {
      logger.error("Erro ao buscar produtos:", error);
      res
        .status(500)
        .json({ success: false, message: "Erro ao buscar produtos" });
    }
  }

  async createProduct(req, res) {
    try {
      const db = getDB();
      const {
        name,
        description,
        price,
        promotional_price,
        sku,
        stock,
        category_id,
        status,
        is_featured,
        images,
      } = req.body;

      if (!name || !price) {
        return res
          .status(400)
          .json({ success: false, message: "Nome e preço são obrigatórios" });
      }

      const slug = name
        .toLowerCase()
        .replace(/[áàãâä]/g, "a")
        .replace(/[éèêë]/g, "e")
        .replace(/[íìîï]/g, "i")
        .replace(/[óòõôö]/g, "o")
        .replace(/[úùûü]/g, "u")
        .replace(/[ç]/g, "c")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const [result] = await db.execute(
        `INSERT INTO products (name, slug, description, price, promotional_price, sku, stock, category_id, status, is_featured, images, sizes, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          name,
          slug,
          description || null,
          price,
          promotional_price || null,
          sku || null,
          stock || 0,
          category_id || null,
          status || "active",
          is_featured || false,
          JSON.stringify(images || []),
          req.body.sizes || null,
        ],
      );

      res.status(201).json({
        success: true,
        message: "Produto criado com sucesso",
        data: { id: result.insertId },
      });
    } catch (error) {
      logger.error("Erro ao criar produto:", error);
      res
        .status(500)
        .json({ success: false, message: "Erro ao criar produto" });
    }
  }

  async updateProductStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!["active", "inactive"].includes(status)) {
        return res
          .status(400)
          .json({ success: false, message: "Status inválido" });
      }
      const db = getDB();
      await db.execute("UPDATE products SET status = ? WHERE id = ?", [
        status,
        id,
      ]);
      res.json({ success: true, message: "Status atualizado" });
    } catch (error) {
      logger.error("Erro ao atualizar status:", error);
      res
        .status(500)
        .json({ success: false, message: "Erro ao atualizar status" });
    }
  }

  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const {
        name,
        description,
        price,
        promotional_price,
        sku,
        stock,
        category_id,
        status,
        is_featured,
        images,
        sizes,
      } = req.body;
      const db = getDB();

      const slug = name
        .toLowerCase()
        .replace(/[áàãâä]/g, "a")
        .replace(/[éèêë]/g, "e")
        .replace(/[íìîï]/g, "i")
        .replace(/[óòõôö]/g, "o")
        .replace(/[úùûü]/g, "u")
        .replace(/[ç]/g, "c")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      await db.execute(
        `UPDATE products SET name = ?, slug = ?, description = ?, price = ?, promotional_price = ?,
             sku = ?, stock = ?, category_id = ?, status = ?, is_featured = ?, images = ?, sizes = ? WHERE id = ?`,
        [
          name,
          slug,
          description || null,
          price,
          promotional_price || null,
          sku || null,
          stock || 0,
          category_id || null,
          status,
          is_featured || false,
          JSON.stringify(images || []),
          sizes || null,
          id,
        ],
      );

      res.json({ success: true, message: "Produto atualizado com sucesso" });
    } catch (error) {
      logger.error("Erro ao atualizar produto:", error);
      res
        .status(500)
        .json({ success: false, message: "Erro ao atualizar produto" });
    }
  }

  async deleteProduct(req, res) {
    try {
      const { id } = req.params;
      const db = getDB();

      await db.execute("DELETE FROM products WHERE id = ?", [id]);

      res.json({ success: true, message: "Produto excluído com sucesso" });
    } catch (error) {
      logger.error("Erro ao excluir produto:", error);
      res
        .status(500)
        .json({ success: false, message: "Erro ao excluir produto" });
    }
  }

  async getCategories(req, res) {
    try {
      const db = getDB();
      const [categories] = await db.execute(
        "SELECT * FROM categories ORDER BY sort_order, name",
      );

      res.json({ success: true, data: categories });
    } catch (error) {
      logger.error("Erro ao buscar categorias:", error);
      res
        .status(500)
        .json({ success: false, message: "Erro ao buscar categorias" });
    }
  }

  async createCategory(req, res) {
    try {
      const db = getDB();
      const { name, description, image_url, sort_order, status } = req.body;
      if (!name)
        return res
          .status(400)
          .json({ success: false, message: "Nome é obrigatório" });

      const slug = name
        .toLowerCase()
        .replace(/[áàãâä]/g, "a")
        .replace(/[éèêë]/g, "e")
        .replace(/[íìîï]/g, "i")
        .replace(/[óòõôö]/g, "o")
        .replace(/[úùûü]/g, "u")
        .replace(/[ç]/g, "c")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const [result] = await db.execute(
        "INSERT INTO categories (name, slug, description, image_url, sort_order, status) VALUES (?, ?, ?, ?, ?, ?)",
        [
          name,
          slug,
          description || null,
          image_url || null,
          sort_order || 0,
          status || "active",
        ],
      );
      res
        .status(201)
        .json({
          success: true,
          message: "Categoria criada com sucesso",
          data: { id: result.insertId },
        });
    } catch (error) {
      logger.error("Erro ao criar categoria:", error);
      res
        .status(500)
        .json({ success: false, message: "Erro ao criar categoria" });
    }
  }

  async updateCategory(req, res) {
    try {
      const { id } = req.params;
      const { name, description, image_url, sort_order, status } = req.body;
      const db = getDB();
      const slug = name
        .toLowerCase()
        .replace(/[áàãâä]/g, "a")
        .replace(/[éèêë]/g, "e")
        .replace(/[íìîï]/g, "i")
        .replace(/[óòõôö]/g, "o")
        .replace(/[úùûü]/g, "u")
        .replace(/[ç]/g, "c")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      await db.execute(
        "UPDATE categories SET name = ?, slug = ?, description = ?, image_url = ?, sort_order = ?, status = ? WHERE id = ?",
        [
          name,
          slug,
          description || null,
          image_url || null,
          sort_order || 0,
          status,
          id,
        ],
      );
      res.json({ success: true, message: "Categoria atualizada com sucesso" });
    } catch (error) {
      logger.error("Erro ao atualizar categoria:", error);
      res
        .status(500)
        .json({ success: false, message: "Erro ao atualizar categoria" });
    }
  }

  async deleteCategory(req, res) {
    try {
      const { id } = req.params;
      const db = getDB();

      const [products] = await db.execute(
        "SELECT COUNT(*) as count FROM products WHERE category_id = ?",
        [id],
      );

      if (products[0].count > 0) {
        return res.status(400).json({
          success: false,
          message: "Não é possível excluir categoria com produtos vinculados",
        });
      }

      await db.execute("DELETE FROM categories WHERE id = ?", [id]);

      res.json({ success: true, message: "Categoria excluída com sucesso" });
    } catch (error) {
      logger.error("Erro ao excluir categoria:", error);
      res
        .status(500)
        .json({ success: false, message: "Erro ao excluir categoria" });
    }
  }

  async getCustomers(req, res) {
    try {
      const db = getDB();
      const search = req.query.search || null;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      let query =
        'SELECT id, name, email, phone, cpf, role, created_at FROM users WHERE role = "user"';
      const params = [];

      if (search) {
        query += " AND (name LIKE ? OR email LIKE ?)";
        params.push(`%${search}%`, `%${search}%`);
      }

      query += " ORDER BY created_at DESC LIMIT ? OFFSET ?";
      params.push(limit, offset);

      const [customers] = await db.execute(query, params);
      const [total] = await db.execute(
        'SELECT COUNT(*) as count FROM users WHERE role = "user"',
      );

      res.json({
        success: true,
        data: {
          customers,
          total: total[0].count,
          page: page,
          totalPages: Math.ceil(total[0].count / limit),
        },
      });
    } catch (error) {
      logger.error("Erro ao buscar clientes:", error);
      res
        .status(500)
        .json({ success: false, message: "Erro ao buscar clientes" });
    }
  }

  async getBanners(req, res) {
    try {
      const db = getDB();
      const [banners] = await db.execute(
        "SELECT * FROM banners ORDER BY sort_order ASC, id ASC",
      );

      res.json({ success: true, data: banners });
    } catch (error) {
      logger.error("Erro ao buscar banners:", error);
      res
        .status(500)
        .json({ success: false, message: "Erro ao buscar banners" });
    }
  }

  async createBanner(req, res) {
    try {
      const db = getDB();
      const {
        title,
        subtitle,
        image_url,
        link,
        position,
        sort_order,
        is_active,
      } = req.body;

      const [result] = await db.execute(
        "INSERT INTO banners (title, subtitle, image_url, link, position, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          title,
          subtitle || null,
          image_url,
          link || null,
          position || "hero",
          sort_order || 0,
          is_active !== false ? 1 : 0,
        ],
      );

      res.status(201).json({
        success: true,
        message: "Banner criado com sucesso",
        data: { id: result.insertId },
      });
    } catch (error) {
      logger.error("Erro ao criar banner:", error);
      res.status(500).json({ success: false, message: "Erro ao criar banner" });
    }
  }

  async updateBanner(req, res) {
    try {
      const { id } = req.params;
      const {
        title,
        subtitle,
        image_url,
        link,
        position,
        sort_order,
        is_active,
      } = req.body;
      const db = getDB();

      await db.execute(
        "UPDATE banners SET title = ?, subtitle = ?, image_url = ?, link = ?, position = ?, sort_order = ?, is_active = ? WHERE id = ?",
        [
          title,
          subtitle || null,
          image_url,
          link || null,
          position,
          sort_order || 0,
          is_active !== false ? 1 : 0,
          id,
        ],
      );

      res.json({ success: true, message: "Banner atualizado com sucesso" });
    } catch (error) {
      logger.error("Erro ao atualizar banner:", error);
      res
        .status(500)
        .json({ success: false, message: "Erro ao atualizar banner" });
    }
  }

  async deleteBanner(req, res) {
    try {
      const { id } = req.params;
      const db = getDB();

      await db.execute("DELETE FROM banners WHERE id = ?", [id]);

      res.json({ success: true, message: "Banner excluído com sucesso" });
    } catch (error) {
      logger.error("Erro ao excluir banner:", error);
      res
        .status(500)
        .json({ success: false, message: "Erro ao excluir banner" });
    }
  }

  async getCoupons(req, res) {
    try {
      const db = getDB();
      const [coupons] = await db.execute(
        "SELECT * FROM coupons ORDER BY created_at DESC",
      );

      res.json({ success: true, data: coupons });
    } catch (error) {
      logger.error("Erro ao buscar cupons:", error);
      res
        .status(500)
        .json({ success: false, message: "Erro ao buscar cupons" });
    }
  }

  async createCoupon(req, res) {
    try {
      const db = getDB();
      const {
        code,
        description,
        discount_type,
        discount_value,
        min_purchase,
        max_uses,
        starts_at,
        expires_at,
      } = req.body;

      const [result] = await db.execute(
        `INSERT INTO coupons (code, description, discount_type, discount_value, min_purchase, max_uses, starts_at, expires_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          code,
          description || null,
          discount_type,
          discount_value,
          min_purchase || 0,
          max_uses || null,
          starts_at || null,
          expires_at || null,
        ],
      );

      res.status(201).json({
        success: true,
        message: "Cupom criado com sucesso",
        data: { id: result.insertId },
      });
    } catch (error) {
      logger.error("Erro ao criar cupom:", error);
      res.status(500).json({ success: false, message: "Erro ao criar cupom" });
    }
  }

  async deleteCoupon(req, res) {
    try {
      const { id } = req.params;
      const db = getDB();

      await db.execute("DELETE FROM coupons WHERE id = ?", [id]);

      res.json({ success: true, message: "Cupom excluído com sucesso" });
    } catch (error) {
      logger.error("Erro ao excluir cupom:", error);
      res
        .status(500)
        .json({ success: false, message: "Erro ao excluir cupom" });
    }
  }

  async updateCoupon(req, res) {
    try {
      const { id } = req.params;
      const {
        status,
        discount_value,
        discount_type,
        description,
        code,
        min_purchase,
        max_uses,
        starts_at,
        expires_at,
      } = req.body;
      const db = getDB();

      const fields = [];
      const values = [];

      if (status !== undefined) {
        fields.push("status = ?");
        values.push(status);
      }
      if (discount_value !== undefined) {
        fields.push("discount_value = ?");
        values.push(discount_value);
      }
      if (discount_type !== undefined) {
        fields.push("discount_type = ?");
        values.push(discount_type);
      }
      if (description !== undefined) {
        fields.push("description = ?");
        values.push(description);
      }
      if (code !== undefined) {
        fields.push("code = ?");
        values.push(code);
      }
      if (min_purchase !== undefined) {
        fields.push("min_purchase = ?");
        values.push(min_purchase);
      }
      if (max_uses !== undefined) {
        fields.push("max_uses = ?");
        values.push(max_uses);
      }
      if (starts_at !== undefined) {
        fields.push("starts_at = ?");
        values.push(starts_at || null);
      }
      if (expires_at !== undefined) {
        fields.push("expires_at = ?");
        values.push(expires_at || null);
      }

      if (!fields.length)
        return res
          .status(400)
          .json({ success: false, message: "Nenhum campo para atualizar" });

      values.push(id);
      await db.execute(
        `UPDATE coupons SET ${fields.join(", ")} WHERE id = ?`,
        values,
      );

      res.json({ success: true, message: "Cupom atualizado com sucesso" });
    } catch (error) {
      logger.error("Erro ao atualizar cupom:", error);
      res
        .status(500)
        .json({ success: false, message: "Erro ao atualizar cupom" });
    }
  }

  async getSpecialCoupons(req, res) {
    try {
      const db = getDB();
      const [coupons] = await db.execute(
        "SELECT * FROM coupons WHERE coupon_type IS NOT NULL ORDER BY created_at ASC",
      );
      res.json({ success: true, data: coupons });
    } catch (error) {
      logger.error("Erro ao buscar cupons especiais:", error);
      res
        .status(500)
        .json({ success: false, message: "Erro ao buscar cupons especiais" });
    }
  }

  async upsertSpecialCoupon(req, res) {
    try {
      const { coupon_type } = req.params;
      const { status, discount_value, discount_type, code, description } =
        req.body;
      const db = getDB();

      const [existing] = await db.execute(
        "SELECT id FROM coupons WHERE coupon_type = ?",
        [coupon_type],
      );

      if (existing.length > 0) {
        await db.execute(
          `UPDATE coupons SET status = ?, discount_value = ?, discount_type = ?, 
                     code = COALESCE(?, code), description = COALESCE(?, description)
                     WHERE coupon_type = ?`,
          [
            status,
            discount_value,
            discount_type,
            code || null,
            description || null,
            coupon_type,
          ],
        );
      } else {
        const couponCode = code || coupon_type.toUpperCase().replace(/_/g, "");
        const desc =
          description ||
          (coupon_type === "first_purchase"
            ? "Desconto na primeira compra"
            : "Cupom especial");
        await db.execute(
          `INSERT INTO coupons (code, description, discount_type, discount_value, coupon_type, status, max_uses)
                     VALUES (?, ?, ?, ?, ?, ?, NULL)`,
          [
            couponCode,
            desc,
            discount_type,
            discount_value,
            coupon_type,
            status,
          ],
        );
      }

      res.json({ success: true, message: "Cupom especial salvo com sucesso" });
    } catch (error) {
      logger.error("Erro ao salvar cupom especial:", error);
      res
        .status(500)
        .json({ success: false, message: "Erro ao salvar cupom especial" });
    }
  }

  async getSalesReport(req, res) {
    try {
      const db = getDB();
      const start_date = req.query.start_date || null;
      const end_date = req.query.end_date || null;

      let query = `
                SELECT DATE(created_at) as date, COUNT(*) as orders, SUM(total_amount) as revenue
                FROM orders
                WHERE status IN ('paid', 'shipped', 'delivered')
            `;
      const params = [];

      if (start_date) {
        query += " AND DATE(created_at) >= ?";
        params.push(start_date);
      }

      if (end_date) {
        query += " AND DATE(created_at) <= ?";
        params.push(end_date);
      }

      query += " GROUP BY DATE(created_at) ORDER BY date DESC";

      const [report] = await db.execute(query, params);

      res.json({ success: true, data: report });
    } catch (error) {
      logger.error("Erro ao gerar relatório:", error);
      res
        .status(500)
        .json({ success: false, message: "Erro ao gerar relatório" });
    }
  }

  async getAlerts(req, res) {
    try {
      const db = getDB();
      const [alerts] = await db.execute(
        "SELECT * FROM store_alerts ORDER BY sort_order ASC, created_at ASC",
      );
      res.json({ success: true, data: alerts });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Erro ao buscar alertas" });
    }
  }

  async createAlert(req, res) {
    try {
      const db = getDB();
      const { title, message } = req.body;
      if (!message)
        return res
          .status(400)
          .json({ success: false, message: "Mensagem é obrigatória" });
      const [result] = await db.execute(
        "INSERT INTO store_alerts (title, message, is_active) VALUES (?, ?, 1)",
        [title || null, message],
      );
      res.status(201).json({ success: true, data: { id: result.insertId } });
    } catch (error) {
      res.status(500).json({ success: false, message: "Erro ao criar alerta" });
    }
  }

  async updateAlert(req, res) {
    try {
      const { id } = req.params;
      const { is_active } = req.body;
      const db = getDB();
      await db.execute("UPDATE store_alerts SET is_active = ? WHERE id = ?", [
        is_active ? 1 : 0,
        id,
      ]);
      res.json({ success: true });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Erro ao atualizar alerta" });
    }
  }

  async deleteAlert(req, res) {
    try {
      const { id } = req.params;
      const db = getDB();
      await db.execute("DELETE FROM store_alerts WHERE id = ?", [id]);
      res.json({ success: true });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Erro ao excluir alerta" });
    }
  }

  async reorderAlerts(req, res) {
    try {
      const db = getDB();
      const { items } = req.body;
      for (const item of items) {
        await db.execute(
          "UPDATE store_alerts SET sort_order = ? WHERE id = ?",
          [item.sort_order, item.id],
        );
      }
      res.json({ success: true });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Erro ao reordenar alertas" });
    }
  }

  async reorderBanners(req, res) {
    try {
      const db = getDB();
      const { items } = req.body;
      for (const item of items) {
        await db.execute("UPDATE banners SET sort_order = ? WHERE id = ?", [
          item.sort_order,
          item.id,
        ]);
      }
      res.json({ success: true });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Erro ao reordenar banners" });
    }
  }

  async reorderCategories(req, res) {
    try {
      const db = getDB();
      const { items } = req.body;
      for (const item of items) {
        await db.execute("UPDATE categories SET sort_order = ? WHERE id = ?", [
          item.sort_order,
          item.id,
        ]);
      }
      res.json({ success: true });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Erro ao reordenar categorias" });
    }
  }

  async getSettings(req, res) {
    try {
      const db = getDB();
      const [settings] = await db.execute("SELECT * FROM store_settings");

      res.json({ success: true, data: settings });
    } catch (error) {
      logger.error("Erro ao buscar configurações:", error);
      res
        .status(500)
        .json({ success: false, message: "Erro ao buscar configurações" });
    }
  }

  async updateSettings(req, res) {
    try {
      const db = getDB();
      const settings = req.body;

      for (const [key, value] of Object.entries(settings)) {
        await db.execute(
          "UPDATE store_settings SET setting_value = ? WHERE setting_key = ?",
          [String(value), key],
        );
      }

      res.json({
        success: true,
        message: "Configurações atualizadas com sucesso",
      });
    } catch (error) {
      logger.error("Erro ao atualizar configurações:", error);
      res
        .status(500)
        .json({ success: false, message: "Erro ao atualizar configurações" });
    }
  }
}

module.exports = new AdminController();