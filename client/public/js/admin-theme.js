// ── Admin Theme (claro/escuro) ────────────────────────────────────────────────
// Aplica o tema salvo ANTES da renderização para evitar flash de tela branca
(function () {
    if (localStorage.getItem('adminTheme') === 'dark') {
        document.documentElement.classList.add('dark');
    }
})();