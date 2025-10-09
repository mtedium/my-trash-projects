if (window.innerWidth <= 768) {
    const toggles = document.querySelectorAll('.footer-toggle');

    toggles.forEach(toggle => {
        toggle.addEventListener('click', () => {
            const parent = toggle.parentElement;

            // 可选择是否允许多个展开。如果多个展开，则注释这一行
            // toggles.forEach(t => t.parentElement !== parent && t.parentElement.classList.remove('active'));

            parent.classList.toggle('active');
        });
    });
}
