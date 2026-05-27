const menuToggle = document.querySelector('.menu-toggle');
const navbarGroup = document.querySelector('.navbar-group');
const bars = menuToggle.querySelector('.icon-bars');
const times = menuToggle.querySelector('.icon-times');

menuToggle.addEventListener('click', () => {
    // 切换菜单显示
    navbarGroup.classList.toggle('active');

    // 切换图标
    if(navbarGroup.classList.contains('active')) {
        bars.style.display = 'none';
        times.style.display = 'block';
    } else {
        bars.style.display = 'block';
        times.style.display = 'none';
    }
});