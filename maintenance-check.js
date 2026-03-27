// maintenance-check.js - Include this in all pages
(function() {
    const supabaseUrl = 'https://amnkoumnvwyjzqcwxord.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFtbmtvdW1udnd5anpxY3d4b3JkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyNTI4ODUsImV4cCI6MjA4NzgyODg4NX0.oyY0OobB7ksAz-ectgkKgJC68DacWfK9w1CftJrEUps';
    
    let supabase;
    let maintenanceCheckInterval;
    
    // Check if supabase is loaded
    if (typeof window.supabase !== 'undefined') {
        supabase = window.supabase.createClient(supabaseUrl, supabaseAnonKey, {
            auth: { persistSession: false }
        });
    } else {
        console.error('Supabase not loaded');
        return;
    }
    
    // Create maintenance overlay styles
    const style = document.createElement('style');
    style.textContent = `
        .maintenance-overlay-global {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: white;
            z-index: 999999;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        .maintenance-box {
            text-align: center;
            padding: 3rem;
            background: white;
            border-radius: 28px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.08);
            max-width: 500px;
            margin: 20px;
            animation: fadeInUp 0.6s ease;
        }
        
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .vercel-logo {
            width: 60px;
            height: auto;
            margin-bottom: 1.5rem;
        }
        
        .maintenance-title {
            font-size: 1.8rem;
            font-weight: 600;
            color: #1e1e1e;
            margin-bottom: 1rem;
            letter-spacing: -0.3px;
        }
        
        .maintenance-message {
            font-size: 1rem;
            color: #5f6368;
            margin-bottom: 1.5rem;
            line-height: 1.6;
        }
        
        .learn-more-link {
            display: inline-block;
            color: #1a73e8;
            text-decoration: none;
            font-weight: 500;
            margin-top: 1rem;
            transition: color 0.2s;
        }
        
        .learn-more-link:hover {
            color: #1557b0;
            text-decoration: underline;
        }
        
        .separator {
            width: 50px;
            height: 2px;
            background: #e8eaed;
            margin: 1rem auto;
        }
    `;
    document.head.appendChild(style);
    
    let maintenanceOverlay = null;
    let isMaintenanceActive = false;
    
    function showMaintenanceScreen() {
        if (maintenanceOverlay) return;
        
        maintenanceOverlay = document.createElement('div');
        maintenanceOverlay.className = 'maintenance-overlay-global';
        maintenanceOverlay.innerHTML = `
            <div class="maintenance-box">
                <svg class="vercel-logo" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 20H22L12 2Z" fill="#000000"/>
                </svg>
                <h1 class="maintenance-title">Website Needs Maintenance</h1>
                <p class="maintenance-message">
                    The website is currently undergoing scheduled maintenance.<br>
                    We'll be back online shortly.
                </p>
                <div class="separator"></div>
                <p class="maintenance-message" style="font-size: 0.9rem; color: #5f6368;">
                    Contact the creator for more information.
                </p>
                <a href="https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/secure-your-dependencies/configuring-dependabot-security-updates" 
                   class="learn-more-link" target="_blank">
                    Learn more →
                </a>
            </div>
        `;
        
        document.body.appendChild(maintenanceOverlay);
        document.body.style.overflow = 'hidden';
        
        // Hide all other content
        for (let child of document.body.children) {
            if (child !== maintenanceOverlay) {
                child.style.display = 'none';
            }
        }
    }
    
    function hideMaintenanceScreen() {
        if (maintenanceOverlay) {
            maintenanceOverlay.remove();
            maintenanceOverlay = null;
        }
        
        // Restore all content
        for (let child of document.body.children) {
            child.style.display = '';
        }
        
        document.body.style.overflow = '';
    }
    
    async function checkMaintenanceStatus() {
        try {
            const { data, error } = await supabase
                .from('maintenance_settings')
                .select('is_active')
                .eq('id', 1)
                .maybeSingle();
            
            if (error) {
                console.error('Error checking maintenance status:', error);
                return;
            }
            
            const shouldShowMaintenance = data ? data.is_active : false;
            
            if (shouldShowMaintenance && !isMaintenanceActive) {
                isMaintenanceActive = true;
                showMaintenanceScreen();
            } else if (!shouldShowMaintenance && isMaintenanceActive) {
                isMaintenanceActive = false;
                hideMaintenanceScreen();
            }
        } catch (err) {
            console.error('Failed to check maintenance status:', err);
        }
    }
    
    // Initial check
    setTimeout(checkMaintenanceStatus, 1000);
    
    // Check every 10 seconds
    maintenanceCheckInterval = setInterval(checkMaintenanceStatus, 10000);
    
    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        if (maintenanceCheckInterval) {
            clearInterval(maintenanceCheckInterval);
        }
    });
})();
