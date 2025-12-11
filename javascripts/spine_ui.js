import { Spine } from '@esotericsoftware/spine-pixi-v7';
import { fetchUrl, loadSpineFromApi } from './spine_core.js';

export class SpineSelector {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.menu = null;
        this.cols = [];
        this.data = { students: [] };
        this.page = 1;
        this.pageSize = 100;
        this.maxPage = Infinity;
        this.isLoading = false;
        this.groupedStudents = new Map();
        
        this.init();
    }

    init() {
        if (getComputedStyle(this.container).position === 'static') {
            this.container.style.position = 'relative';
        }

        // Check if controls are enabled (default true)
        if (this.container.dataset.controls === 'false') return;

        const btn = document.createElement('div');
        btn.className = 'spine-selector-btn';
        btn.textContent = '☰';
        btn.onclick = (e) => {
            e.stopPropagation();
            this.toggleMenu();
        };
        this.container.appendChild(btn);

        this.menu = document.createElement('div');
        this.menu.className = 'spine-selector-menu';
        this.menu.onclick = (e) => e.stopPropagation();
        this.container.appendChild(this.menu);
        
        document.addEventListener('click', () => {
            this.menu.classList.remove('active');
        });
    }

    toggleMenu() {
        this.menu.classList.toggle('active');
        if (this.menu.classList.contains('active')) {
            if (this.data.students.length === 0) {
                console.log("Loading students...");
                this.loadStudents();
            }
        }
    }

    async loadStudents() {
        if (this.isLoading || this.page > this.maxPage) return;
        this.isLoading = true;

        // Show loading indicator only on first load or if needed
        if (this.page === 1) {
            this.renderCol(0, [{ name: 'Loading...', id: -1 }]);
        }

        try {
            const res = await fetchUrl(`https://api.kivo.wiki/api/v1/data/students/?page=${this.page}&page_size=${this.pageSize}`, 'json');
            if (!res.success) throw new Error(res.message);
            
            this.maxPage = res.data.max_page;
            const newStudents = res.data.students;
            
            newStudents.forEach(s => {
                const name = (s.family_name || '') + (s.given_name || '');
                if (!name) return;
                
                if (!this.groupedStudents.has(name)) {
                    this.groupedStudents.set(name, {
                        name: name,
                        defaultAvatar: s.avatar,
                        skins: []
                    });
                }
                const group = this.groupedStudents.get(name);
                group.skins.push(s);
                if (!s.skin) {
                    group.defaultAvatar = s.avatar;
                }
            });
            
            this.data.students = Array.from(this.groupedStudents.values());
            this.renderStudents();
            
            this.page++;
        } catch (e) {
            if (this.page === 1) {
                this.renderCol(0, [{ name: 'Error: ' + e.message, id: -1 }]);
            } else {
                console.error("Failed to load more students:", e);
            }
        } finally {
            this.isLoading = false;
        }
    }

    renderCol(index, items, onClick) {
        while (this.cols.length <= index) {
            const col = document.createElement('div');
            col.className = 'spine-selector-col';
            this.menu.appendChild(col);
            this.cols.push(col);
            
            // Trigger animation
            requestAnimationFrame(() => {
                col.classList.add('active-col');
            });
            
            // Add scroll listener for the first column (students list)
            if (this.cols.length === 1) {
                col.addEventListener('scroll', () => {
                    if (col.scrollTop + col.clientHeight >= col.scrollHeight - 50) {
                        this.loadStudents();
                    }
                });
            }
        }
        while (this.cols.length > index + 1) {
            const col = this.cols.pop();
            col.classList.remove('active-col');
            setTimeout(() => {
                col.remove();
            }, 300);
        }

        const col = this.cols[index];
        
        // If appending to existing list (pagination), don't clear innerHTML
        // But here we are re-rendering the whole grouped list every time for simplicity
        // To optimize, we could only append new items, but since we group by name, 
        // new data might merge into existing groups. So re-rendering is safer.
        // We just need to preserve scroll position.
        const scrollTop = col.scrollTop;
        col.innerHTML = '';
        
        items.forEach(item => {
            const el = document.createElement('div');
            el.className = 'spine-selector-item';
            if (item.defaultAvatar || item.avatar) {
                const img = document.createElement('img');
                let src = item.defaultAvatar || item.avatar;
                if (src.startsWith('//')) src = 'https:' + src;
                img.src = src;
                el.appendChild(img);
            }
            const span = document.createElement('span');
            span.textContent = item.name || item.skin || '原皮';
            el.appendChild(span);
            
            el.onclick = (e) => {
                e.stopPropagation();
                Array.from(col.children).forEach(c => c.classList.remove('active'));
                el.classList.add('active');
                if (onClick) onClick(item);
            };
            col.appendChild(el);
        });

        if (index === 0 && this.page > 1) {
             col.scrollTop = scrollTop;
        }
    }

    renderStudents() {
        this.renderCol(0, this.data.students, (student) => {
            this.renderSkins(student);
        });
    }

    renderSkins(student) {
        const items = student.skins.map(s => ({
            ...s,
            name: s.skin_cn || s.skin || '原皮'
        }));
        this.renderCol(1, items, (skin) => {
            this.selectSkin(skin, 2);
        });
    }

    async selectSkin(skin, colIndex) {
        this.renderCol(colIndex, [{ name: 'Loading...', id: -1 }]);
        
        try {
            const studentRes = await fetchUrl(`https://api.kivo.wiki/api/v1/data/students/${skin.id}`, 'json');
            if (!studentRes.success) throw new Error(studentRes.message);
            
            const spineIds = studentRes.data.spine || [];
            if (spineIds.length === 0) {
                this.renderCol(colIndex, [{ name: 'No spines', id: -1 }]);
                return;
            }

            const validSpines = [];
            // Fetch spines in parallel
            await Promise.all(spineIds.map(async (sid) => {
                try {
                    const spineRes = await fetchUrl(`https://api.kivo.wiki/api/v1/data/spines/${sid}`, 'json');
                    if (spineRes.success && spineRes.data.type === 'home') {
                        validSpines.push(spineRes.data);
                    }
                } catch (e) {
                    console.warn('Failed to fetch spine', sid, e);
                }
            }));

            if (validSpines.length === 0) {
                this.renderCol(colIndex, [{ name: 'No home spines', id: -1 }]);
                return;
            }

            this.renderCol(colIndex, validSpines, (spine) => {
                this.loadSpine(spine.id);
                this.menu.classList.remove('active');
            });

        } catch (e) {
            this.renderCol(colIndex, [{ name: 'Error: ' + e.message, id: -1 }]);
        }
    }

    loadSpine(id) {
        const container = document.getElementById(this.containerId);
        // If ID is different, update dataset to trigger observer in SpineController
        if (container.dataset.id !== String(id)) {
            container.dataset.id = id;
        } else {
            // If ID is same, force reload with current options
            const options = container._spineOptions || {};
            loadSpineFromApi(this.containerId, id, options);
        }
    }
}

export class SpineController {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.options = {
            x: 0,
            y: 0,
            scale: 1.0,
            alpha: false
        };
        
        // Sync with initial data attributes
        this.syncFromData();
        
        this.initUI();
        this.initObserver();
    }
    
    syncFromData() {
        const d = this.container.dataset;
        if (d.x) this.options.x = parseFloat(d.x) || 0;
        if (d.y) this.options.y = parseFloat(d.y) || 0;
        if (d.scale) this.options.scale = parseFloat(d.scale) || 1.0;
        if (d.alpha) this.options.alpha = d.alpha === 'true';
        
        this.container._spineOptions = this.options;
    }
    
    updateData() {
        this.container.dataset.x = this.options.x;
        this.container.dataset.y = this.options.y;
        this.container.dataset.scale = this.options.scale;
        this.container.dataset.alpha = this.options.alpha;
    }

    initUI() {
        // Check if controls are enabled (default true)
        if (this.container.dataset.controls === 'false') return;

        // Create control panel
        const panel = document.createElement('div');
        panel.className = 'spine-controls';
        
        const createInput = (label, key, step = 1, type = 'number') => {
            const row = document.createElement('div');
            row.className = 'spine-controls-row';
            
            const lbl = document.createElement('label');
            lbl.textContent = label;
            
            const input = document.createElement('input');
            input.type = type;
            if (type === 'checkbox') {
                input.checked = this.options[key];
            } else {
                input.value = this.options[key];
                input.step = step;
            }
            
            input.oninput = (e) => {
                const val = type === 'checkbox' ? e.target.checked : parseFloat(e.target.value);
                
                // Skip if value hasn't changed (to prevent loops if needed)
                if (this.options[key] === val) return;

                this.options[key] = val;
                this.updateData(); 
                
                // Force update immediately for smoother interaction
                if (key === 'alpha') {
                    // Alpha requires reload. 
                    // Since we updated options above, the Observer will see options.alpha == val and NOT trigger reload.
                    // So we must trigger it manually here.
                    const id = this.container.dataset.id;
                    if (id) {
                        loadSpineFromApi(this.containerId, id, this.options);
                    }
                } else {
                    this.triggerUpdate();
                }
            };
            
            row.appendChild(lbl);
            row.appendChild(input);
            panel.appendChild(row);
            return input;
        };
        
        this.inputs = {
            x: createInput('X Offset', 'x', 10),
            y: createInput('Y Offset', 'y', 10),
            scale: createInput('Scale', 'scale', 0.1),
            alpha: createInput('Alpha (PMA)', 'alpha', null, 'checkbox')
        };
        
        this.container.appendChild(panel);
        
        // Toggle Button
        const btn = document.createElement('div');
        btn.textContent = '⚙️';
        btn.className = 'spine-controls-btn';
        btn.onclick = (e) => {
            e.stopPropagation();
            panel.classList.toggle('active');
        };
        this.container.appendChild(btn);
        
        // Close on click outside
        document.addEventListener('click', (e) => {
            if (!panel.contains(e.target) && e.target !== btn) {
                panel.classList.remove('active');
            }
        });
    }
    
    triggerUpdate() {
        const app = this.container._pixiApp;
        if (app && app.stage && app.stage.children.length > 0) {
            const spine = app.stage.children.find(c => c instanceof Spine);
            if (spine && spine.updateLayout) {
                spine.updateLayout();
            }
        }
    }
    
    initObserver() {
        const observer = new MutationObserver((mutations) => {
            let needReload = false;
            let needUpdateTransform = false;
            
            mutations.forEach(m => {
                try {
                    if (m.type === 'attributes' && m.attributeName.startsWith('data-')) {
                        const key = m.attributeName.replace('data-', '');
                        const val = this.container.dataset[key];
                        
                        console.log(`[SpineController] Attribute changed: ${key} = ${val}`);

                        if (key === 'id') {
                            needReload = true;
                            console.log(`[SpineController] ID changed to ${val}, scheduling reload.`);
                        } else if (key === 'alpha') {
                            const boolVal = val === 'true';
                            if (this.options.alpha !== boolVal) {
                                this.options.alpha = boolVal;
                                if (this.inputs && this.inputs.alpha) this.inputs.alpha.checked = boolVal;
                                needReload = true;
                            }
                        } else if (['x', 'y', 'scale'].includes(key)) {
                            const numVal = parseFloat(val);
                            if (!isNaN(numVal) && this.options[key] !== numVal) {
                                this.options[key] = numVal;
                                if (this.inputs && this.inputs[key]) this.inputs[key].value = numVal;
                                needUpdateTransform = true;
                            }
                        }
                    }
                } catch (err) {
                    console.error(`[SpineController] Error processing mutation for ${m.attributeName}:`, err);
                }
            });
            
            if (needReload) {
                const id = this.container.dataset.id;
                console.log(`[SpineController] Triggering reload for ID: ${id}`);
                if (id) {
                    loadSpineFromApi(this.containerId, id, this.options);
                }
            } else if (needUpdateTransform) {
                // Update existing spine if available
                const app = this.container._pixiApp;
                if (app && app.stage && app.stage.children.length > 0) {
                    const spine = app.stage.children.find(c => c instanceof Spine);
                    if (spine && spine.updateLayout) {
                        spine.updateLayout();
                    }
                }
            }
        });
        
        observer.observe(this.container, { attributes: true });
    }
}
