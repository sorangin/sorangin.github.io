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

function initComicResume(container) {
    const book = (container || document).querySelector('.comic-book');
    if (!book || book.dataset.comicInit) return;
    book.dataset.comicInit = '1';

    const coverLeaf = book.querySelector('.leaf-cover');
    const lastLeaf = book.querySelector('.leaf-last');
    const hint = book.closest('.comic-resume')?.querySelector('.comic-hint');
    const hints = [
        'Click the comic to open it',
        'Click to flip to the back cover',
        'Click to close the comic'
    ];
    let state = 0;
    let busy = false;

    const goTo = (next) => {
        busy = true;
        const moving = [];
        if ((state >= 1) !== (next >= 1)) moving.push(coverLeaf);
        if ((state >= 2) !== (next >= 2)) moving.push(lastLeaf);
        moving.forEach((leaf) => {
            leaf.classList.add('turning');
            if (next < state) leaf.classList.add('closing');
        });
        state = next;
        book.dataset.state = String(next);
        coverLeaf.classList.toggle('flipped', next >= 1);
        lastLeaf.classList.toggle('flipped', next >= 2);
        if (hint) hint.textContent = hints[next];
        setTimeout(() => {
            moving.forEach((leaf) => leaf.classList.remove('turning', 'closing'));
            busy = false;
        }, 820);
    };

    const flip = () => {
        if (busy) return;
        if (state === 2) {
            // From the back cover, flip the whole closed book over to the front
            // cover in one motion - no leafing back through the inside pages.
            busy = true;
            book.classList.add('book-flip');
            setTimeout(() => {
                book.classList.add('no-anim');
                state = 0;
                book.dataset.state = '0';
                coverLeaf.classList.remove('flipped');
                lastLeaf.classList.remove('flipped');
                if (hint) hint.textContent = hints[0];
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => book.classList.remove('no-anim'));
                });
            }, 250);
            setTimeout(() => {
                book.classList.remove('book-flip');
                busy = false;
            }, 520);
            return;
        }
        goTo((state + 1) % 3);
    };

    book.addEventListener('click', flip);
    book.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            flip();
        }
    });
}

// --- YouTube Integration ---
let ytPlayer;

// Reusable modal init for injected templates

function initVideoShowcase(context) {
    context.querySelectorAll('.video-showcase').forEach(showcase => {
        const iframe = showcase.querySelector('.showcase-player iframe');
        const nowTitle = showcase.querySelector('.showcase-now-title');
        const thumbs = showcase.querySelectorAll('.showcase-thumb');
        thumbs.forEach(thumb => {
            thumb.addEventListener('click', () => {
                const embed = thumb.getAttribute('data-embed');
                if (!embed || !iframe) return;
                iframe.src = embed + (embed.includes('vimeo') ? '?autoplay=1' : '?autoplay=1&rel=0');
                iframe.title = thumb.getAttribute('data-title') || '';
                if (nowTitle) nowTitle.textContent = thumb.getAttribute('data-title') || '';
                thumbs.forEach(t => t.classList.remove('is-playing'));
                thumb.classList.add('is-playing');
            });
        });
    });
}


// Members-only game downloads. The download links are stored encrypted in
// two payloads: the Rank 3 password unlocks most games (prototypes and works
// in progress); the Rank 4 password unlocks everything, including the top
// tier games. To rotate a password, re-encrypt that tier's links JSON with
// the new password and replace its constants below.
const GATE_TIERS = {
    4: { salt: 'Ul+sWLU6cu/kdhYk5NrhRQ==', iv: 'kQgRqRbOunF/zBuw', data: 'ZNGS2DqG4/SNH1B+Z1ynokpzaWps/tIto3T35yx+xbK+mclMhdXU9QoImCcbpYLHetH5W7FZywRDyir9NS6mWeLLunsgDQIw6drcZX6IYhYi/5L/26jjwfCHuUX3wov9b5vjawb+i4muDtlrsoLfkZdg3/oQM+eq+RrpdvdUxwprxw+PNL7XH9VyL+hV6xYsvV9f8kZXd1sUvf/QDI2Ws0ZLnLqEcdWGeCwsWa8hfgFCXN+lY37srI0+wVcK1RLkbYPEGEpAkWE7/qbpazs7PejHObD3LX5u9Vw21S2JrOn9WMpN4mExby+avtIvvZDlZSkCGXzG8EzvwcEQ7B5p83BUZNBT53arUjjByHUtQ7VapyAsZVpUfl5YTE7P/o1bmZMvs7Y/UMg48AEdzeUeDAPWZH4NPsYPLAJSY/ba65lSPY/wL5N3c1OBqjtpCWJg8QsXselLAKJyfze3QBXbw5nOdweG19kZMs7U5wNsgn6wF+oMZUMN8gCGgGU7nxDU+M8T44KsmtyqTDRBw19sOGRdiJV5dPA5+LQsyM/rQNKBSiAVM5fQElGputZRm64XMCJ9cln8EqG3ZF1vaWzzWPlnZAimXFFAA2+yBo6XvZwG29m9wzSEOS2YOOYZrJsjnQtO4TRq6eiJLZCbgyyv7Frj5vawrUgLD4X5xJfMZQ2VFoUnXpPF9EuzJVhK0AkPsNOkXntkRcewc4PtloVLmm279pRcJ1u104Tu2x0BU5Uul8vacLFXDbVqqgqwpTuwd5MFbOtmPLavpzhQsxXoOghpTgJ1KwFCwvWsD5gXEk1CpbZ0dkABxi5y+uamcWJ+NX6BHT7qump+ScdWy88tmR2hA+2fhoLA+B1JcxOprv7hsTCGqvFZcuBKb18W4iLOW1CZpyZDje+BBshJuWU3/dL/7BDkX/YVBLqHG5k=' },
    3: { salt: 'P35ezGUKZSOc7NBGD1w4sg==', iv: 'v6HvfwD4TmNMLd0j', data: 'vE3nCdN6qMwDlmqO9QLYJnOxEgR8a6XiJdOeOhjM/oazoiw7NlAT9JfGlhZKRW0Ddi6Td/FtRr2+Sz3/PX8phJWPVBGYeKY1r6aezmYAdVjTzYrq61PsWAfxEbTWZ7O9hAS/IAQ1WIvFI3EC3iIZn9zVqu/KQgcVrcpAcZqZFoU4DVu1OwCZmW+9NgsmKz2ogvVFeyGWe2brWJuCElJ/vcVxJa/sdBrobJO8elFyhX6PnoTViJZwySA4ZeHrvUDky2AFiZQA7FhipdENEpYl/Q8Xe6pWj3tVZCltvVz+MyGsBr7bTWP8ii0p3w+J2FVmRZpKnZnpnEZrtiLoGoNYMB6OATo3nBwOKAw3Mucp/mUjPjghlWSe/HdcFheTzfN7MM2sqPyUL7BI5vzdFxcGaQa2S0EA5T/8gLf3jI6hg7i0zk3NVA9V3qbO0n45AFSACq0J9TnAUbozUbfslgUeYQk6vOs/mzAYq3xtKqFcpVPAyLPpuGE9Pd2rR95gxCiCyTFx9R0h/7h3xxpHVJx9mdhCbwSFa5Rtta0bslMQqNltvEx8mHLJH6CcpvK8wbsg+1FZbePTN3W0QkhRRdIvXL9UDPCgXgQSUiwBUMUVlmW3lBJLQTznyzu6nSLY4nvMlK9XWDdB/Ofe+R8gqNmt/YWzLOLN/qVgDOJWmbvvX5egUWfobrhAUxYTGL/ffLufbU5o' }
};
let gatePending = null;

function gateB64ToBytes(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
}

async function gateDecrypt(tier, password) {
    const t = GATE_TIERS[tier];
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
    const key = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: gateB64ToBytes(t.salt), iterations: 150000, hash: 'SHA-256' },
        keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
    const plain = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: gateB64ToBytes(t.iv) }, key, gateB64ToBytes(t.data));
    return JSON.parse(new TextDecoder().decode(plain));
}

async function gateTryUnlock(password) {
    try { return { level: 4, links: await gateDecrypt(4, password) }; }
    catch (e) { return { level: 3, links: await gateDecrypt(3, password) }; }
}

function gateGetAccess() {
    try { return JSON.parse(localStorage.getItem('fw_gate_access_v2') || 'null'); } catch (e) { return null; }
}

function initGameGate(context) {
    const modal = document.getElementById('gate-modal');
    const form = document.getElementById('gate-form');
    const input = document.getElementById('gate-password');
    const error = document.getElementById('gate-error');
    const modalNote = document.getElementById('gate-modal-note');
    const defaultError = error ? error.textContent : '';

    function refreshButtons() {
        const access = gateGetAccess();
        document.querySelectorAll('.gate-download, .gate-play').forEach(btn => {
            if (btn.hasAttribute('data-pending')) {
                btn.classList.remove('unlocked');
                const pnote = btn.querySelector('.gate-note') || (btn.parentElement ? btn.parentElement.querySelector('.gate-note') : null);
                if (pnote) pnote.innerHTML = '<i class="fas fa-lock"></i> Rank 3+ members &middot; Demo coming soon';
                return;
            }
            const tier = parseInt(btn.getAttribute('data-tier') || '3', 10);
            const ok = !!(access && access.level >= tier && access.links[btn.getAttribute('data-game')]);
            btn.classList.toggle('unlocked', ok);
            const note = btn.querySelector('.gate-note') || (btn.parentElement ? btn.parentElement.querySelector('.gate-note') : null);
            if (note) {
                note.innerHTML = ok
                    ? '<i class="fas fa-lock-open"></i> Unlocked on this device'
                    : (tier >= 4
                        ? '<i class="fas fa-lock"></i> Rank 4 members'
                        : '<i class="fas fa-lock"></i> Rank 3+ members');
            }
        });
    }

    context.querySelectorAll('.gate-download, .gate-play').forEach(btn => {
        if (btn.hasAttribute('data-pending')) return;
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const tier = parseInt(btn.getAttribute('data-tier') || '3', 10);
            const access = gateGetAccess();
            const url = access && access.level >= tier && access.links[btn.getAttribute('data-game')];
            if (url) { window.open(url, '_blank', 'noopener'); return; }
            gatePending = { game: btn.getAttribute('data-game'), tier: tier };
            if (modal) {
                if (error) error.hidden = true;
                if (modalNote) {
                    modalNote.textContent = (access && tier > access.level)
                        ? 'This one is for Rank 4 members. Enter the Rank 4 password to unlock it.'
                        : '';
                }
                if (input) input.value = '';
                modal.classList.add('show');
                if (input) setTimeout(() => input.focus(), 60);
            }
        });
    });

    if (form && !form.dataset.bound) {
        form.dataset.bound = '1';
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const access = await gateTryUnlock(input.value.trim());
                localStorage.setItem('fw_gate_access_v2', JSON.stringify(access));
                localStorage.removeItem('fw_gate_links');
                localStorage.removeItem('fw_gate_access');
                refreshButtons();
                if (gatePending && access.level < gatePending.tier) {
                    if (error) {
                        error.textContent = 'That password unlocked Rank ' + access.level + ', but this one needs the Rank 4 password.';
                        error.hidden = false;
                    }
                    return;
                }
                modal.classList.remove('show');
                const url = gatePending && access.links[gatePending.game];
                gatePending = null;
                if (url) window.open(url, '_blank', 'noopener');
            } catch (err) {
                if (error) { error.textContent = defaultError; error.hidden = false; }
            }
        });
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('show'));
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('show'); });
    }
    refreshButtons();
}

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
            currentGalleryItems = galleryElements.map(t => {
                const src = t.getAttribute('href') || t.querySelector('img')?.src || t.querySelector('video')?.getAttribute('src');
                return {
                    src: src,
                    alt: t.querySelector('img')?.alt || t.querySelector('video')?.getAttribute('aria-label') || 'Artwork',
                    type: /\.(mp4|webm)([?#]|$)/i.test(src || '') ? 'video' : 'image'
                };
            });
            
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
    const lightboxVideo = document.getElementById('lightbox-video');
    const item = currentGalleryItems[currentGalleryIndex];
    
    if (item && lightboxImg) {
        if (item.type === 'video' && lightboxVideo) {
            lightboxImg.style.display = 'none';
            lightboxVideo.style.display = 'block';
            lightboxVideo.style.opacity = '0';
            setTimeout(() => {
                lightboxVideo.src = item.src;
                lightboxVideo.style.opacity = '1';
                lightboxVideo.play();
            }, 150);
        } else {
            if (lightboxVideo) {
                lightboxVideo.pause();
                lightboxVideo.removeAttribute('src');
                lightboxVideo.load();
                lightboxVideo.style.display = 'none';
            }
            lightboxImg.style.display = 'block';
            lightboxImg.style.opacity = '0';
            setTimeout(() => {
                lightboxImg.src = item.src;
                lightboxImg.alt = item.alt;
                lightboxImg.style.opacity = '1';
            }, 150);
        }
        
        renderThumbnails();

        const caption = document.getElementById('lightbox-caption');
        const counter = document.getElementById('lightbox-counter');
        if (caption) caption.textContent = item.alt || '';
        if (counter) counter.textContent = `${currentGalleryIndex + 1} / ${currentGalleryItems.length}`;
        const lb = document.getElementById('image-lightbox');
        if (lb) lb.classList.toggle('single', currentGalleryItems.length <= 1);
    }
}

function renderThumbnails() {
    const container = document.getElementById('lightbox-thumbnails');
    if (!container) return;
    
    container.innerHTML = '';
    currentGalleryItems.forEach((item, index) => {
        const thumb = document.createElement('div');
        thumb.className = `thumb-item ${index === currentGalleryIndex ? 'active' : ''}`;
        thumb.innerHTML = item.type === 'video'
            ? `<video src="${item.src}#t=0.1" muted playsinline preload="metadata"></video>`
            : `<img src="${item.src}" alt="${item.alt}">`;
        thumb.onclick = (e) => {
            e.stopPropagation();
            currentGalleryIndex = index;
            updateLightbox();
        };
        container.appendChild(thumb);
        
        if (index === currentGalleryIndex) {
            // Scroll only the thumbnail strip so the current thumb centres
            // itself (scrollIntoView also dragged the page behind around)
            requestAnimationFrame(() => {
                const tr = thumb.getBoundingClientRect();
                const cr = container.getBoundingClientRect();
                const left = container.scrollLeft + (tr.left - cr.left) - (cr.width - tr.width) / 2;
                container.scrollTo({ left, behavior: 'smooth' });
            });
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


// --- Clean URL routing (added 2026-11-17) ---
const PAGE_PATHS = {
    "home": "/",
    "animations": "/animations",
    "animations-stick": "/stick",
    "animations-costco": "/costco",
    "animations-2d": "/2d-animations",
    "animations-misc": "/misc",
    "art-illustrations": "/illustrations",
    "art-sketches": "/sketches",
    "art-drawlloween-2022": "/drawlloween-2022",
    "art-inktober-2017": "/inktober-2017",
    "art-inktober-2018": "/inktober-2018",
    "art-reddit-gets-drawn": "/reddit-gets-drawn",
    "art-pixel-art": "/pixel-art",
    "comics": "/comics",
    "games": "/games",
    "knights-gambit": "/games/knights-gambit",
    "revenge-of-the-ants": "/games/revenge-of-the-ants",
    "kingsfall-chess": "/games/kingsfall-chess",
    "risen-realms": "/games/risen-realms",
    "yoink-the-king": "/games/yoink-the-king",
    "frostfire": "/games/frostfire",
    "small-world": "/games/small-world",
    "the-return": "/games/the-return",
    "ashes-of-veridian": "/games/ashes-of-veridian",
    "ninja-arena": "/games/ninja-arena",
    "about": "/about"
};
function pagePath(pageName) { return PAGE_PATHS[pageName] || '/'; }
const LEGACY_PAGE_PATHS = {
    "/membership": "home",
    "/animations/stick": "animations-stick",
    "/animations/costco": "animations-costco",
    "/animations/2d": "animations-2d",
    "/animations/misc": "animations-misc",
    "/art/illustrations": "art-illustrations",
    "/art/sketches": "art-sketches",
    "/art/drawlloween-2022": "art-drawlloween-2022",
    "/art/inktober-2017": "art-inktober-2017",
    "/art/inktober-2018": "art-inktober-2018",
    "/art/reddit-gets-drawn": "art-reddit-gets-drawn",
    "/art/pixel-art": "art-pixel-art",
};
// Membership has no separate page: it is the section at the bottom of Home.
function goToMembership() {
    loadPage('home', 'membership');
}
function pageFromPath(path) {
    if (!path) return null;
    let p = path.replace(/\/+$/, '');
    if (p === '') p = '/';
    for (const page of Object.keys(PAGE_PATHS)) {
        if (PAGE_PATHS[page] === p) return page;
    }
    return LEGACY_PAGE_PATHS[p] || null;
}

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
            loadYouTubeFeed(appContainer);
        }

        // Re-init modals
        initModals(appContainer);
        initVideoShowcase(appContainer);
        initGameGate(appContainer);
        initComicResume(appContainer);

        // Update URL
        let newUrl = pagePath(pageName);
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




function initSubscribeForm(context) {
    const form = context.querySelector('#subscribe-form');
    const messageEl = context.querySelector('#subscribe-message');
    const emailInput = context.querySelector('#subscriber-email');

    if (form && messageEl) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = emailInput.value.trim();
            if (!email) return;

            messageEl.textContent = 'Subscribing...';
            messageEl.className = 'subscribe-message';
            messageEl.style.opacity = '1';

            // Real signup: post the email to the Kit "Website Footer" form.
            // Kit is double opt-in, so the subscriber gets a confirmation
            // email and only joins the list after clicking it.
            const body = new FormData();
            body.append('email_address', email);
            fetch(form.action, { method: 'POST', body, mode: 'no-cors' })
                .then(() => {
                    messageEl.textContent = 'Almost done! Check your inbox to confirm.';
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
                    }, 8000);
                })
                .catch(() => {
                    // In-page post failed - fall back to a normal form submit
                    form.submit();
                });
        });
    }
}

function loadYouTubeFeed(container) {
    const feedContainer = container.querySelector('#yt-feed-container');
    if (!feedContainer) return;

    const channelId = "UC_EY0v8qbaEBTzYNNxC9qkQ";
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const rss2jsonUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

    // Premium fallback videos representing recent Costco worker animations
    const fallbackVideos = [
        {
            title: "Costco - Produce",
            id: "afWWQYQYnoI",
            thumbnail: "https://i.ytimg.com/vi/afWWQYQYnoI/hqdefault.jpg"
        },
        {
            title: "Day in the Life of a Costco Worker - Pharmacy",
            id: "cDaHmPKWqQo",
            thumbnail: "https://i.ytimg.com/vi/cDaHmPKWqQo/hqdefault.jpg"
        },
        {
            title: "Day in the Life of a Costco Worker - Assistant",
            id: "vSi6EDyK2EI",
            thumbnail: "https://i.ytimg.com/vi/vSi6EDyK2EI/hqdefault.jpg"
        }
    ];

    function renderVideos(videos) {
        feedContainer.innerHTML = '';
        videos.forEach(video => {
            const card = document.createElement('a');
            card.className = 'portfolio-card video-trigger';
            card.href = `https://www.youtube.com/watch?v=${video.id}`;
            card.setAttribute('data-video', `https://www.youtube.com/watch?v=${video.id}`);

            // Unescape HTML entities in titles
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = video.title;
            const cleanTitle = tempDiv.textContent || tempDiv.innerText || video.title;

            card.innerHTML = `
                <div class="card-image-container">
                    <img class="portfolio-image yt-thumb-img" src="${video.thumbnail}" alt="${cleanTitle}" loading="lazy">
                    <div class="image-overlay"><i class="fas fa-play play-icon"></i></div>
                </div>
                <div class="card-content">
                    <h3 class="portfolio-title">${cleanTitle}</h3>
                </div>
            `;

            feedContainer.appendChild(card);
        });

        // Re-initialize modal triggers for the new dynamic elements
        initModals(feedContainer);
    }

        // Backup path: if the feed proxy is down, read the channel RSS directly
    // through a mirror before giving up and showing the fallback videos.
    function renderBackupFeed() {
        fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`)
            .then(r => { if (!r.ok) throw new Error("Backup feed request failed"); return r.text(); })
            .then(xmlText => {
                const doc = new DOMParser().parseFromString(xmlText, "text/xml");
                const videos = [...doc.querySelectorAll("entry")].slice(0, 3).map(entry => {
                    const idEl = entry.getElementsByTagName("yt:videoId")[0];
                    const titleEl = entry.querySelector("title");
                    const vid = idEl ? idEl.textContent : "";
                    return { title: titleEl ? titleEl.textContent : "", id: vid, thumbnail: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg` };
                }).filter(v => v.id);
                if (videos.length === 0) throw new Error("Backup feed empty");
                renderVideos(videos);
            })
            .catch(() => renderVideos(fallbackVideos));
    }

// Try fetching live data
    fetch(rss2jsonUrl)
        .then(response => {
            if (!response.ok) throw new Error("Feed request failed");
            return response.json();
        })
        .then(data => {
            if (data.status === 'ok' && data.items && data.items.length > 0) {
                const videos = data.items.slice(0, 3).map(item => {
                    let videoId = '';
                    if (item.link) {
                        const match = item.link.match(/(v=|\/shorts\/|\/embed\/|youtu\.be\/)([^#\&\?\/]+)/);
                        if (match) videoId = match[2];
                    }
                    if (!videoId && item.guid) {
                        const parts = item.guid.split(':');
                        videoId = parts[parts.length - 1];
                    }
                    
                    return {
                        title: item.title,
                        id: videoId || item.guid,
                        thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
                    };
                });
                renderVideos(videos);
            } else {
                console.warn("Feed data empty or bad status, using fallbacks");
                renderVideos(fallbackVideos);
            }
        })
        .catch(() => renderBackupFeed());
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
        const page = (window.location.pathname !== '/' ? pageFromPath(window.location.pathname) : null) || new URLSearchParams(window.location.search).get('page') || 'home';
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

    // Close mobile menu when tapping outside the panel or pressing Escape
    document.addEventListener('click', (e) => {
        if (!document.body.classList.contains('mobile-nav-open')) return;
        if (!e.target.closest('.mobile-nav-container') && !e.target.closest('.mobile-menu-toggle')) {
            document.body.classList.remove('mobile-nav-open');
        }
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') document.body.classList.remove('mobile-nav-open');
    });

    // Close mobile menu when a link is clicked
    const mobileNavLinks = document.querySelectorAll('.main-nav a, .dropdown-menu a, .header-social-links a');
    mobileNavLinks.forEach(link => {
        link.addEventListener('click', () => {
            document.body.classList.remove('mobile-nav-open');
        });
    });

    // Dropdown parent links (Animations, Art) have no inline onclick; this
    // capture-phase handler owns their clicks. Desktop: navigate. Mobile:
    // first tap expands the submenu, second tap navigates. Capture phase +
    // stopPropagation keep the menu's close-on-link-click listener from
    // firing on the first tap.
    document.addEventListener('click', (e) => {
        const subLink = e.target.closest('.dropdown-menu a');
        if (subLink) {
            document.querySelectorAll('.has-dropdown.open').forEach(item => item.classList.remove('open'));
            return;
        }
        const parentLink = e.target.closest('.has-dropdown > .nav-link[data-page]');
        if (!parentLink) return;
        e.preventDefault();
        const item = parentLink.closest('.has-dropdown');
        const page = parentLink.getAttribute('data-page');
        if (!window.matchMedia('(max-width: 1024px)').matches) {
            loadPage(page);
            return;
        }
        if (item.classList.contains('open')) {
            document.querySelectorAll('.has-dropdown.open').forEach(i => i.classList.remove('open'));
            document.body.classList.remove('mobile-nav-open');
            loadPage(page);
        } else {
            e.stopPropagation();
            document.querySelectorAll('.has-dropdown.open').forEach(other => {
                if (other !== item) other.classList.remove('open');
            });
            item.classList.add('open');
        }
    }, true);

    // Gallery Navigation (scoped to the image lightbox: the hub lightbox
    // earlier in the document reuses the same button classes)
    const prevBtn = document.querySelector('#image-lightbox .prev-btn');
    const nextBtn = document.querySelector('#image-lightbox .next-btn');
    if (prevBtn) prevBtn.onclick = (e) => { e.stopPropagation(); navigateGallery(-1); };
    if (nextBtn) nextBtn.onclick = (e) => { e.stopPropagation(); navigateGallery(1); };

    // Touch swipe: swipe left/right on the image to move through the gallery.
    // Swipes starting on the thumbnail strip are left alone so it can scroll.
    const lightboxEl = document.getElementById('image-lightbox');
    if (lightboxEl) {
        let swipeX = null, swipeY = null;
        lightboxEl.addEventListener('touchstart', (e) => {
            if (e.target.closest('.lightbox-thumbnails')) { swipeX = null; return; }
            swipeX = e.changedTouches[0].screenX;
            swipeY = e.changedTouches[0].screenY;
        }, { passive: true });
        lightboxEl.addEventListener('touchend', (e) => {
            if (swipeX === null) return;
            const dx = e.changedTouches[0].screenX - swipeX;
            const dy = e.changedTouches[0].screenY - swipeY;
            swipeX = null;
            if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
                navigateGallery(dx < 0 ? 1 : -1);
            }
        }, { passive: true });
    }

    document.addEventListener('keydown', (e) => {
        const lightbox = document.getElementById('image-lightbox');
        if (lightbox && lightbox.classList.contains('show')) {
            if (e.key === 'ArrowLeft') navigateGallery(-1);
            if (e.key === 'ArrowRight') navigateGallery(1);
        }
    });

    // Global Subscribe Form
    initSubscribeForm(document);
    
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

        // Keep the button from covering the footer (it used to sit on top of
        // the Subscribe button): hide it while the footer is on screen
        const footer = document.querySelector('.site-footer');
        if (footer && 'IntersectionObserver' in window) {
            new IntersectionObserver((entries) => {
                entries.forEach(en => backToTopButton.classList.toggle('footer-hide', en.isIntersecting));
            }).observe(footer);
        }
    }

    // --- Hub Gallery Lightbox ---
    const hubLightbox = document.getElementById('hub-lightbox');
    const hubLightboxVideo = document.getElementById('hub-lightbox-video');
    if (hubLightbox && hubLightboxVideo) {
        let hubIndex = 0;
        const hubThumbs = () => Array.from(document.querySelectorAll('.hub-gallery video'));
        const hubThumbsBar = document.getElementById('hub-lightbox-thumbs');
        const syncHubThumbs = () => {
            if (!hubThumbsBar) return;
            hubThumbsBar.querySelectorAll('.thumb-item').forEach((el, i) => {
                el.classList.toggle('active', i === hubIndex);
            });
        };
        const renderHubThumbs = () => {
            if (!hubThumbsBar) return;
            hubThumbsBar.innerHTML = '';
            hubThumbs().forEach((v, i) => {
                const item = document.createElement('div');
                item.className = `thumb-item ${i === hubIndex ? 'active' : ''}`;
                const tv = document.createElement('video');
                tv.src = v.getAttribute('src') + '#t=0.1';
                tv.muted = true;
                tv.playsInline = true;
                tv.preload = 'metadata';
                item.appendChild(tv);
                item.addEventListener('click', () => showHubVideo(i));
                hubThumbsBar.appendChild(item);
            });
        };
        const showHubVideo = (idx) => {
            const thumbs = hubThumbs();
            if (!thumbs.length) return;
            hubIndex = ((idx % thumbs.length) + thumbs.length) % thumbs.length;
            hubLightboxVideo.src = thumbs[hubIndex].getAttribute('src');
            hubLightboxVideo.play();
            syncHubThumbs();
        };
        document.addEventListener('click', (e) => {
            const thumb = e.target.closest('.hub-gallery video');
            if (thumb) {
                hubIndex = hubThumbs().indexOf(thumb);
                hubLightboxVideo.src = thumb.getAttribute('src');
                hubLightbox.classList.add('show');
                document.body.style.overflow = 'hidden';
                hubLightboxVideo.play();
                renderHubThumbs();
            }
        });
        const hubPrev = document.getElementById('hub-lightbox-prev');
        const hubNext = document.getElementById('hub-lightbox-next');
        if (hubPrev) hubPrev.addEventListener('click', () => showHubVideo(hubIndex - 1));
        if (hubNext) hubNext.addEventListener('click', () => showHubVideo(hubIndex + 1));
        const stopHubVideo = () => {
            hubLightboxVideo.pause();
            hubLightboxVideo.removeAttribute('src');
            hubLightboxVideo.load();
        };
        hubLightbox.addEventListener('click', (e) => {
            if (e.target === hubLightbox || e.target.closest('.modal-close')) stopHubVideo();
        });
        document.addEventListener('keydown', (e) => {
            if (!hubLightbox.classList.contains('show')) return;
            if (e.key === 'Escape') stopHubVideo();
            if (e.key === 'ArrowLeft') showHubVideo(hubIndex - 1);
            if (e.key === 'ArrowRight') showHubVideo(hubIndex + 1);
        });
    }

    // --- Modal Closing Logic (Global) ---
    const closeModal = () => {
        document.querySelectorAll('.modal-overlay.show').forEach(modal => {
            modal.classList.remove('show');
        });
        
        // Stop video by clearing the container
        const videoModal = document.getElementById('video-modal');
        if (videoModal) {
            const videoContainer = videoModal.querySelector('.video-responsive');
            if (videoContainer) {
                videoContainer.innerHTML = '<div id="player"></div>';
            }
        }
        
        // Pause any gallery video playing in the image lightbox
        const galleryVideo = document.getElementById('lightbox-video');
        if (galleryVideo) {
            galleryVideo.pause();
            galleryVideo.removeAttribute('src');
            galleryVideo.load();
            galleryVideo.style.display = 'none';
        }
        
        document.body.style.overflow = 'auto'; // Re-enable background scrolling
    };

    // Close buttons
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });

    // Close on clicking the dark background - or anywhere off the content:
    // in the image viewer, anything that is not the image itself, the arrows,
    // the thumbnails, or the close button exits; same idea for the video modal.
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) { closeModal(); return; }
            if (overlay.id === 'image-lightbox') {
                const img = document.getElementById('lightbox-img');
                const vid = document.getElementById('lightbox-video');
                if (e.target !== img && e.target !== vid && !e.target.closest('.lightbox-nav-btn, .thumb-item, .modal-close')) {
                    closeModal();
                }
            } else if (overlay.id === 'video-modal') {
                if (!e.target.closest('.video-responsive, .modal-close')) closeModal();
            }
        });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    // --- Initial SPA Load ---
    const urlParams = new URLSearchParams(window.location.search);
    let pageToLoad = null;
    const spaPath = sessionStorage.getItem('spa_path');
    if (spaPath) {
        sessionStorage.removeItem('spa_path');
        pageToLoad = pageFromPath(spaPath);
    }
    if (!pageToLoad && window.location.pathname !== '/') {
        pageToLoad = pageFromPath(window.location.pathname);
    }
    if (!pageToLoad) pageToLoad = urlParams.get('page');
    if (!pageToLoad || !document.getElementById('tpl-' + pageToLoad)) pageToLoad = 'home';
    const initialHash = window.location.hash.substring(1);
    
    if (document.getElementById('app-container')) {
        const bootPath = spaPath || window.location.pathname;
        loadPage(pageToLoad, bootPath === '/membership' ? 'membership' : initialHash);
    }
});
