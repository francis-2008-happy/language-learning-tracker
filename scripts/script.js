document.addEventListener('DOMContentLoaded', () => {
    // Get references to the DOM elements
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');

    // Function to toggle the sidebar
    function toggleSidebar() {
        document.body.classList.toggle('sidebar-open');
    }

    // Event listener for the hamburger menu click
    if (hamburgerMenu) {
        hamburgerMenu.addEventListener('click', toggleSidebar);
    }

    // Event listener for the overlay click (to close sidebar when clicking outside)
    if (overlay) {
        overlay.addEventListener('click', toggleSidebar);
    }

    // Optional: Close sidebar when a navigation item is clicked (common UX)
    const navItems = document.querySelectorAll('.sidebar .nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Only close if in mobile view (sidebar is fixed)
            if (window.innerWidth < 1024) { // Use the same breakpoint as in CSS
                toggleSidebar();
            }
        });
    });

    // Optional: Close sidebar if window is resized to desktop from mobile while open
    window.addEventListener('resize', () => {
        if (window.innerWidth >= 1024 && document.body.classList.contains('sidebar-open')) {
            document.body.classList.remove('sidebar-open');
        }
    });
});