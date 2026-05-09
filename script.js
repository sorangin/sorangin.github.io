// --- Reusable initialization functions (called after template injection) ---

function initCardAnimations(container) {
    const cards = (container || document).querySelectorAll('.portfolio-card, .game-card');
    if ('IntersectionObserver' in window) {
        const cardObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = `cardFadeInUp 0.6s ${entry.target.dataset.delay || '0s'} ease-out forwards`;
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        cards.forEach((card, index) => {
            card.dataset.delay = `${index * 0.08}s`;
            cardObserver.observe(card);
        });
    } else {
        cards.forEach(card => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        });
    }
}

function initCardHoverEffects(container) {
    const cards = (container || document).querySelectorAll('.portfolio-card, .game-card');
    cards.forEach(card => {
        const img = card.querySelector('.portfolio-image, .game-image');
        const staticSrc = img?.dataset.staticSrc;
        const gifSrc = img?.dataset.gifSrc;

        if (img && staticSrc && gifSrc) {
            card.addEventListener('mouseenter', () => {
                img.src = gifSrc;
            });
            card.addEventListener('mouseleave', () => {
                img.src = staticSrc;
            });
        }
    });
}

// --- YouTube Integration ---
let ytPlayer;

// Reusable modal init for injected templates
function initModals(context) {
    const videoModal = document.getElementById('video-modal');
    const videoContainer = videoModal?.querySelector('.video-responsive');
    const videoTriggers = context.querySelectorAll('.video-trigger');
    
    videoTriggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const videoUrl = trigger.getAttribute('data-video');
            const videoId = getYouTubeID(videoUrl);
            
            if (videoId && videoModal) {
                videoModal.classList.add('show');
                document.body.style.overflow = 'hidden';

                // Add mute=1 to satisfy browser autoplay policies, which often cause configuration errors
                const videoIdClean = videoId.trim();
                const embedUrl = `https://www.youtube.com/embed/${videoIdClean}?autoplay=1&mute=1&rel=0`;
                
                if (videoContainer) {
                    videoContainer.innerHTML = `<iframe src="${embedUrl}" frameborder="0" allow="autoplay; fullscreen" allowfullscreen style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></iframe>`;
                }
            } else if (videoUrl && videoUrl.includes('vimeo') && videoModal) {
                const container = videoModal.querySelector('.video-responsive');
                container.innerHTML = `<iframe src="${videoUrl}?autoplay=1" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
                videoModal.classList.add('show');
                document.body.style.overflow = 'hidden';
            }
        });
    });

    const imageLightbox = document.getElementById('image-lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxTriggers = context.querySelectorAll('.lightbox-trigger');

    lightboxTriggers.forEach((trigger, index) => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Get all items in the current page gallery
            const galleryElements = Array.from(context.querySelectorAll('.lightbox-trigger'));
            currentGalleryItems = galleryElements.map(t => ({
                src: t.getAttribute('href') || t.querySelector('img')?.src,
                alt: t.querySelector('img')?.alt || 'Artwork'
            }));
            
            currentGalleryIndex = index;
            updateLightbox();
            
            if (imageLightbox) {
                imageLightbox.classList.add('show');
                document.body.style.overflow = 'hidden';
            }
        });
    });
}

// Gallery State Management
let currentGalleryItems = [];
let currentGalleryIndex = 0;

function updateLightbox() {
    const lightboxImg = document.getElementById('lightbox-img');
    const item = currentGalleryItems[currentGalleryIndex];
    
    if (item && lightboxImg) {
        lightboxImg.style.opacity = '0';
        setTimeout(() => {
            lightboxImg.src = item.src;
            lightboxImg.alt = item.alt;
            lightboxImg.style.opacity = '1';
        }, 150);
        
        renderThumbnails();
    }
}

function renderThumbnails() {
    const container = document.getElementById('lightbox-thumbnails');
    if (!container) return;
    
    container.innerHTML = '';
    currentGalleryItems.forEach((item, index) => {
        const thumb = document.createElement('div');
        thumb.className = `thumb-item ${index === currentGalleryIndex ? 'active' : ''}`;
        thumb.innerHTML = `<img src="${item.src}" alt="${item.alt}">`;
        thumb.onclick = (e) => {
            e.stopPropagation();
            currentGalleryIndex = index;
            updateLightbox();
        };
        container.appendChild(thumb);
        
        if (index === currentGalleryIndex) {
            thumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
    });
}

function navigateGallery(direction) {
    if (currentGalleryItems.length <= 1) return;
    
    currentGalleryIndex += direction;
    if (currentGalleryIndex >= currentGalleryItems.length) currentGalleryIndex = 0;
    if (currentGalleryIndex < 0) currentGalleryIndex = currentGalleryItems.length - 1;
    
    updateLightbox();
}

// --- Single Page Application (SPA) Routing ---
const container = document.getElementById('app-container');
const navLinks = document.querySelectorAll('.main-nav a');

function loadPage(pageName, sectionId) {
    const appContainer = document.getElementById('app-container');
    if (!appContainer) return;
    
    const template = document.getElementById(`tpl-${pageName}`);
    if (!template) {
        console.error("Template not found: " + pageName);
        return;
    }

    // Fade Out
    appContainer.classList.add('fading');

    setTimeout(() => {
        // Swap content
        appContainer.innerHTML = '';
        const clone = template.content.cloneNode(true);
        appContainer.appendChild(clone);
        
        // Update Classes for Formatting
        if (['home', 'animations', 'illustrations', 'comics', 'games', 'about'].includes(pageName) || pageName.startsWith('art-') || pageName.startsWith('animations-')) {
            appContainer.className = 'content-area';
        } else {
            appContainer.className = 'content-area game-detail-page';
        }
        
        // Re-initialize scripts for newly injected content
        initCardHoverEffects(appContainer);
        initCardAnimations(appContainer);
        
        if (pageName === 'home') {
            initSubscribeForm(appContainer);
            loadLatestYouTubeVideo(appContainer);
        }

        // Re-init modals
        initModals(appContainer);

        // Update URL
        let newUrl = pageName === 'home' ? window.location.pathname : `?page=${pageName}`;
        if (sectionId) newUrl += `#${sectionId}`;
        history.pushState({ page: pageName, sectionId: sectionId }, "", newUrl);

        // Update Active Nav States
        updateNavState(pageName);

        // Scroll Logic
        if (sectionId) {
            const section = document.getElementById(sectionId);
            if (section) {
                const headerHeight = 85; // Account for sticky header
                window.scrollTo({
                    top: section.offsetTop - headerHeight,
                    behavior: 'smooth'
                });
            }
        } else {
            window.scrollTo(0, 0);
        }

        // Fade In
        appContainer.classList.remove('fading');
    }, 200);
}





function getYouTubeID(url) {
    if (!url) return null;
    const cleanUrl = url.trim();
    
    let id = null;
    if (cleanUrl.includes('/shorts/')) {
        id = cleanUrl.split('/shorts/')[1].split(/[?#\/]/)[0];
    } else if (cleanUrl.includes('/embed/')) {
        id = cleanUrl.split('/embed/')[1].split(/[?#\/]/)[0];
    } else if (cleanUrl.includes('v=')) {
        id = cleanUrl.split('v=')[1].split(/[&?#]/)[0];
    } else {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?\/]*).*/;
        const match = cleanUrl.match(regExp);
        id = (match && match[2].length === 11) ? match[2] : null;
    }
    
    return id ? id.trim() : null;
}

function getIcon(type) {
    switch(type) {
        case 'video': return 'fa-play';
        case 'game': return 'fa-star';
        case 'image': return 'fa-search-plus';
        default: return 'fa-plus';
    }
}

function updateNavState(pageName) {
    const navLinks = document.querySelectorAll('.main-nav a');
    navLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href && (href.includes(pageName) || (pageName === 'home' && href.includes('index.html')))) {
            link.classList.add('active');
        }
    });
}



function initSubscribeForm(context) {
    const form = context.querySelector('#subscribe-form');
    const messageEl = context.querySelector('#subscribe-message');
    const emailInput = context.querySelector('#subscriber-email');

    if (form && messageEl) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = emailInput.value;
            
            // Premium feedback logic
            messageEl.textContent = 'Subscribing...';
            messageEl.className = 'subscribe-message';
            messageEl.style.opacity = '1';
            
            // Simulate API call
            setTimeout(() => {
                messageEl.textContent = 'Thanks for subscribing! Check your inbox soon.';
                messageEl.classList.add('success');
                emailInput.value = '';
                
                // Clear message after a while
                setTimeout(() => {
                    messageEl.style.opacity = '0';
                    setTimeout(() => {
                        messageEl.textContent = '';
                        messageEl.style.opacity = '1';
                        messageEl.className = 'subscribe-message';
                    }, 500);
                }, 5000);
            }, 1200);
        });
    }
}

function loadLatestYouTubeVideo(context) {
    const container = context.querySelector('#dynamic-yt-container');
    if (!container) return;

    const channelId = 'UC510n17nJ6J-6x8p4R8971g';
    const rssUrl = encodeURIComponent(`https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`);
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${rssUrl}`;

    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'ok' && data.items.length > 0) {
                const latestVideo = data.items[0];
                const videoUrl = latestVideo.link;
                const videoId = getYouTubeID(videoUrl);
                
                if (videoId) {
                    container.innerHTML = `
                        <iframe
                            src="https://www.youtube-nocookie.com/embed/${videoId}"
                            title="${latestVideo.title}"
                            style="border:none; border-radius:8px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowfullscreen></iframe>
                    `;
                } else {
                    container.innerHTML = '<p style="color: var(--text-muted); padding: 2rem;">Could not parse latest video.</p>';
                }
            } else {
                container.innerHTML = '<p style="color: var(--text-muted); padding: 2rem;">Unable to load latest video at this time.</p>';
            }
        })
        .catch(err => {
            console.error('Error fetching YouTube RSS:', err);
            container.innerHTML = '<p style="color: var(--text-muted); padding: 2rem;">Unable to load latest video at this time.</p>';
        });
}

// Navigation State Management
function updateNavState(pageName) {
    const navLinks = document.querySelectorAll('.main-nav a, .main-nav .nav-link');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        // Clear all active states first
        link.classList.remove('active');
        
        if (href) {
            // Check for direct page match
            if (href.includes(`page=${pageName}`)) {
                link.classList.add('active');
            } 
            // Parent highlighting for Art categories
            else if (pageName.startsWith('art-') && (href.includes('page=art-illustrations') || href.includes('art-illustrations'))) {
                link.classList.add('active');
            }
            // Parent highlighting for Animation categories
            else if ((pageName.startsWith('animations-') || ['stick-animations', 'costco', '2d-animations', 'misc-animations'].includes(pageName)) && href.includes('page=animations')) {
                link.classList.add('active');
            }
        }
    });
}

// Handle Browser Back/Forward Buttons
window.onpopstate = function(event) {
    if (event.state && event.state.page) {
        loadPage(event.state.page, event.state.sectionId);
    } else {
        const urlParams = new URLSearchParams(window.location.search);
        const page = urlParams.get('page') || 'home';
        const hash = window.location.hash.substring(1);
        loadPage(page, hash);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // --- Global Initializations ---

    // Mobile Menu Toggle
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', () => {
            document.body.classList.toggle('mobile-nav-open');
        });
    }

    // Close mobile menu when a link is clicked
    const mobileNavLinks = document.querySelectorAll('.main-nav a, .dropdown-menu a, .header-social-links a');
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            document.body.classList.remove('mobile-nav-open');
        });
    });

    // Gallery Navigation
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');
    if (prevBtn) prevBtn.onclick = (e) => { e.stopPropagation(); navigateGallery(-1); };
    if (nextBtn) nextBtn.onclick = (e) => { e.stopPropagation(); navigateGallery(1); };

    document.addEventListener('keydown', (e) => {
        const lightbox = document.getElementById('image-lightbox');
        if (lightbox && lightbox.classList.contains('show')) {
            if (e.key === 'ArrowLeft') navigateGallery(-1);
            if (e.key === 'ArrowRight') navigateGallery(1);
        }
    });
    
    // Update Copyright Year
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // Back to Top Button
    const backToTopButton = document.getElementById('back-to-top');
    if (backToTopButton) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTopButton.classList.add('show');
            } else {
                backToTopButton.classList.remove('show');
            }
        }, { passive: true });

        backToTopButton.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- Modal Closing Logic (Global) ---
    const closeModal = () => {
        const videoModal = document.getElementById('video-modal');
        const imageLightbox = document.getElementById('image-lightbox');
        
        if (videoModal) {
            videoModal.classList.remove('show');
            // Stop video by clearing the container
            const videoContainer = videoModal.querySelector('.video-responsive');
            if (videoContainer) {
                videoContainer.innerHTML = '<div id="player"></div>';
            }
        }
        
        if (imageLightbox) imageLightbox.classList.remove('show');
        document.body.style.overflow = 'auto'; // Re-enable background scrolling
    };

    // Close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    // Close on clicking the dark background
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    // --- Initial SPA Load ---
    const urlParams = new URLSearchParams(window.location.search);
    const pageToLoad = urlParams.get('page') || 'home';
    const initialHash = window.location.hash.substring(1);
    
    if (document.getElementById('app-container')) {
        loadPage(pageToLoad, initialHash);
    }
});
