// ============================================
// ROYALCARDS - Main JavaScript
// ============================================

document.addEventListener('DOMContentLoaded', () => {

    // ---------- Mobile Menu Toggle ----------
    const mobileToggle = document.getElementById('mobileToggle');
    const mainNav = document.querySelector('.main-nav');

    if (mobileToggle && mainNav) {
        mobileToggle.addEventListener('click', () => {
            mainNav.classList.toggle('active');
            mobileToggle.classList.toggle('active');
        });

        document.querySelectorAll('.main-nav a').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth < 768) {
                    mainNav.classList.remove('active');
                    mobileToggle.classList.remove('active');
                }
            });
        });
    }

    // ---------- Search Bar Toggle ----------
    const searchToggle = document.getElementById('searchToggle');
    const searchBar = document.getElementById('searchBar');

    if (searchToggle && searchBar) {
        searchToggle.addEventListener('click', () => {
            searchBar.classList.toggle('active');
            if (searchBar.classList.contains('active')) {
                const input = searchBar.querySelector('input');
                if (input) setTimeout(() => input.focus(), 100);
            }
        });
    }

    // ---------- Add to Cart ----------
    document.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            const originalText = this.textContent;
            this.textContent = 'Hinzugefügt ♛';
            this.style.background = 'var(--gold)';
            this.style.color = 'var(--violet-deep)';

            const cartCount = document.querySelector('.cart-count');
            if (cartCount) {
                cartCount.textContent = parseInt(cartCount.textContent || '0') + 1;
                cartCount.style.transform = 'scale(1.3)';
                setTimeout(() => cartCount.style.transform = 'scale(1)', 300);
            }

            setTimeout(() => {
                this.textContent = originalText;
                this.style.background = '';
                this.style.color = '';
            }, 1500);
        });
    });

    // ---------- Wishlist ----------
    document.querySelectorAll('.product-wishlist').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.preventDefault();
            this.textContent = this.textContent === '♡' ? '♥' : '♡';
            this.style.color = this.textContent === '♥' ? 'var(--gold)' : '';
            if (this.textContent === '♥') {
                this.style.background = 'var(--violet-deep)';
                this.style.transform = 'scale(1.2)';
                setTimeout(() => this.style.transform = '', 300);
            } else {
                this.style.background = '';
            }
        });
    });

    // ---------- Scroll Reveal ----------
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.category-card, .product-card, .feature, .testimonial, .arrival-item, .value-card, .grading-card, .process-step, .team-member').forEach(el => {
        el.classList.add('reveal');
        observer.observe(el);
    });

    // ---------- Header Scroll Effect ----------
    const header = document.querySelector('.header');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        if (currentScroll > 100) {
            header.style.boxShadow = '0 4px 20px rgba(58, 27, 92, 0.12)';
        } else {
            header.style.boxShadow = '';
        }
        lastScroll = currentScroll;
    });

    // ---------- Smooth Anchor Scroll ----------
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const offset = 100;
                const targetPos = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({ top: targetPos, behavior: 'smooth' });
            }
        });
    });

    // ---------- Form submissions ----------
    document.querySelectorAll('form').forEach(form => {
        if (form.classList.contains('newsletter-form')) return;
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('button[type="submit"], .btn-primary');
            if (submitBtn) {
                const originalText = submitBtn.textContent;
                submitBtn.textContent = 'Wird gesendet...';
                submitBtn.disabled = true;
                setTimeout(() => {
                    submitBtn.textContent = 'Erfolgreich gesendet ♛';
                    setTimeout(() => {
                        submitBtn.textContent = originalText;
                        submitBtn.disabled = false;
                        form.reset();
                    }, 2000);
                }, 1000);
            }
        });
    });

    // ---------- Pagination Demo ----------
    document.querySelectorAll('.pagination button').forEach(btn => {
        btn.addEventListener('click', function() {
            if (this.disabled || this.textContent === '‹' || this.textContent === '›') return;
            document.querySelectorAll('.pagination button').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            window.scrollTo({ top: document.querySelector('.shop-main')?.offsetTop - 100 || 0, behavior: 'smooth' });
        });
    });
});
