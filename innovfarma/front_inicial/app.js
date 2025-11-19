/*
  front_inicial SPA (vanilla JS)
  Routes (hash): #/inicio, #/productos, #/productos/create, #/productos/edit/:id, #/clientes, #/facturas, #/login
*/
(function(){
  const main = document.getElementById('pageContent');
  const userNameEl = document.getElementById('userName');
  const btnLogin = document.getElementById('btnLogin');
  const btnLogout = document.getElementById('btnLogout');
  const btnMenuToggle = document.getElementById('btnMenuToggle');
  const sidebarOverlay = document.getElementById('sidebarOverlay');

  // Sidebar toggle helpers
  function setMenuButtonState(){
    try{
      if(!btnMenuToggle) return;
      if(window.innerWidth <= 900){
        btnMenuToggle.setAttribute('aria-expanded', document.body.classList.contains('sidebar-open') ? 'true' : 'false');
      } else {
        // collapsed state -> aria-expanded=false
        btnMenuToggle.setAttribute('aria-expanded', document.body.classList.contains('sidebar-collapsed') ? 'false' : 'true');
      }
    }catch(_){ }
  }

  function toggleSidebar(){
    if(window.innerWidth <= 900){
      document.body.classList.toggle('sidebar-open');
    } else {
      document.body.classList.toggle('sidebar-collapsed');
    }
    setMenuButtonState();
  }

  function closeSidebarMobile(){ document.body.classList.remove('sidebar-open'); setMenuButtonState(); }
  function openSidebarMobile(){ document.body.classList.add('sidebar-open'); setMenuButtonState(); }

  if(btnMenuToggle){ btnMenuToggle.addEventListener('click', toggleSidebar); }
  if(sidebarOverlay){ sidebarOverlay.addEventListener('click', closeSidebarMobile); }

  // close sidebar overlay when clicking any sidebar link on small screens
  document.addEventListener('click', (e)=>{
    try{
      if(window.innerWidth <= 900){
        const a = e.target.closest && e.target.closest('.sidebar a');
        if(a) closeSidebarMobile();
      }
    }catch(_){ }
  });

  // ensure consistent classes on resize
  window.addEventListener('resize', ()=>{
    try{
      if(window.innerWidth > 900){
        // ensure mobile overlay removed
        document.body.classList.remove('sidebar-open');
      } else {
        // ensure desktop collapsed removed when entering mobile view
        document.body.classList.remove('sidebar-collapsed');
      }
      setMenuButtonState();
    }catch(_){ }
  });

  // initial state
  setMenuButtonState();

  // Simple API wrapper (session-based auth: send cookies)
  async function apiFetch(path, options={}){
    options = Object.assign({}, options);
    // ensure we send credentials (cookies) for session auth
    options.credentials = options.credentials || 'include';
    const headers = options.headers || {};
    options.headers = Object.assign({'Content-Type':'application/json'}, headers);
    const res = await fetch(path, options);
    if(res.status === 204) return null;
    const data = await res.json().catch(()=>null);
    if(!res.ok) throw { status: res.status, data };
    return data;
  }

  // Normalize backend product responses into an array of product objects
  function normalizeProducts(data){
    if(!data) return [];
    if(Array.isArray(data)) return data;
    if(data.productos && Array.isArray(data.productos)) return data.productos;
    if(data.data && Array.isArray(data.data)) return data.data;
    if(data.productos && typeof data.productos === 'object') return Object.values(data.productos);
    // some backends may return an object map of id->producto
    if(typeof data === 'object'){
      const vals = Object.values(data).filter(v=> v && typeof v === 'object' && (v.Nombre_comercial || v.codigo || v.id || v._id));
      if(vals.length) return vals;
    }
    return [];
  }

  // Current user role (set at login)
  let CURRENT_USER_ROLE = null;

  function applyRolePermissions(role){
    // Show/hide sidebar links based on data-roles attribute
    try{
      const links = document.querySelectorAll('.sidebar nav a[data-roles]');
      links.forEach(a=>{
        const allowed = String(a.dataset.roles || '').split(',').map(s=>s.trim()).filter(Boolean);
        if(allowed.length === 0 || allowed.indexOf('*') !== -1){
          a.style.display = '';
        } else if(role && allowed.indexOf(role) !== -1){
          a.style.display = '';
        } else {
          // hide link
          a.style.display = 'none';
        }
      });
      // also hide any submenu items if parent is hidden
      document.querySelectorAll('.sidebar nav li').forEach(li=>{
        const primary = li.querySelector('a[data-roles]');
        if(primary && primary.style.display === 'none'){
          li.style.display = 'none';
        } else {
          li.style.display = '';
        }
      });
    }catch(e){ console.error('applyRolePermissions error', e); }
  }

  // Router
  function navigate(hash){
    location.hash = hash;
  }

  function getRoute(){
    const hash = location.hash || '#/inicio';
    return hash.replace(/^#/, '');
  }

  async function render(){
    const route = getRoute();
    updateActiveNav(route);
    try{
  if(route === '' || route === '/inicio') return renderInicio();
  if(route.startsWith('/productos')) return renderProductos(route);
  if(route.startsWith('/inventarios')) return renderInventarios(route);
  if(route === '/ventas' || route.startsWith('/ventas')) return renderVentas(route);
      if(route === '/clientes') return renderClientes();
        if(route === '/facturas') return renderFacturas();
        if(route.startsWith('/compras')) return renderCompras(route);
      if(route === '/login') return renderLogin();
      // default
      return renderInicio();
    }catch(err){
      console.error(err);
      main.innerHTML = `<div class="alert error">Error: ${err.message || JSON.stringify(err)}</div>`;
    }
  }

  /* ----------------- Ventas (POS) ----------------- */
  async function renderVentas(route){
    // Access control: this section is available only to users with role 'vendedor'
    if(CURRENT_USER_ROLE !== 'vendedor'){
      main.innerHTML = `<div class="page-header"><h2>Ventas</h2></div><div class="card"><div class="alert error">Acceso restringido: esta sección sólo está disponible para usuarios con rol <strong>vendedor</strong>.</div></div>`;
      return;
    }

    main.innerHTML = `<div class="page-header"><h2>Ventas</h2></div>`+
      `<div class="pos-layout pos-layout-vertical">
         <div class="pos-products card">
           <div style="display:flex;gap:8px;margin-bottom:8px">
             <select id="posFilterType" style="padding:8px;border:1px solid #ddd;border-radius:6px"><option value="all">Todos los productos</option></select>
             <input id="posSearch" placeholder="Buscar productos (código/nombre)" style="flex:1;padding:8px;border:1px solid #ddd;border-radius:6px"> 
             <button id="posScan" class="btn small">Buscar</button>
            <button id="posToggleDebug" class="btn small ghost" title="Mostrar respuesta cruda">Debug</button>
           </div>
           <div id="posTableWrap" style="overflow:auto;border-top:4px solid #24a6b3;height:100%"></div>
           <pre id="posDebug" style="display:none;white-space:pre-wrap;max-height:200px;overflow:auto;margin-top:8px;background:#f7f7f7;padding:8px;border-radius:6px;border:1px solid #eee"></pre>
         </div>
         <div class="pos-cart card">
           <h3>Detalle de venta</h3>
           <div id="cartContainer"></div>
         </div>
       </div>`;

    document.getElementById('posSearch').addEventListener('input', debounce(async (e)=>{ await loadPosProducts(e.target.value); }, 250));
    document.getElementById('posScan').addEventListener('click', async ()=>{ const q = document.getElementById('posSearch').value; await loadPosProducts(q); });
  const dbgBtn = document.getElementById('posToggleDebug');
  const dbgPre = document.getElementById('posDebug');
  if(dbgBtn && dbgPre){ dbgBtn.addEventListener('click', ()=>{ dbgPre.style.display = dbgPre.style.display === 'none' ? 'block' : 'none'; dbgBtn.textContent = dbgPre.style.display === 'none' ? 'Debug' : 'Ocultar'; }); }

    // load initial products
    await loadPosProducts('');
    renderCart();
  }

  // POS state
  const POS = { items: [], client_id: null, sucursal_id: null };

  async function posSearch(q){
    // kept for backward compat, but prefer product table
    await loadPosProducts(q);
  }

  // Load products and render table for POS. Uses filter POST endpoint when available.
  async function loadPosProducts(q){
    const wrap = document.getElementById('posTableWrap'); if(!wrap) return;
    wrap.innerHTML = '<div class="muted">Cargando productos...</div>';
    try{
      let items = [];
      let rawDebug = null;
      // try filter endpoint
      try{
        const data = await apiFetch('/api/productos/filtrar', { method:'POST', body: JSON.stringify({ term: q, limit: 200 }) }).catch(()=>null);
        rawDebug = data;
        // debug: log raw response from backend to help diagnose client parse/render issues
        console.log('[DEBUG loadPosProducts] /api/productos/filtrar raw response:', data);
        items = normalizeProducts(data);
        // ensure each item has id and numeric Precio_venta
        items = items.map(p=>{
          // if item is a primitive (string/number), coerce to object so rendering won't fail
          if(p === null || p === undefined) return { id: '', Nombre_comercial: '', Precio_venta: 0 };
          if(typeof p !== 'object'){
            return { id: String(p), Nombre_comercial: String(p), Precio_venta: 0 };
          }
          if(!p.id){
            if(p._id){
              try{
                if(p._id && typeof p._id === 'object' && p._id.$oid) p.id = p._id.$oid;
                else p.id = String(p._id);
              }catch(e){ p.id = String(p._id); }
            } else if(p.codigo) p.id = String(p.codigo);
            else p.id = p.id || '';
          }
          p.Precio_venta = (p.Precio_venta !== undefined && p.Precio_venta !== null) ? p.Precio_venta : (p.precio !== undefined ? p.precio : 0);
          // ensure existencia fields exist
          p.existencia = p.existencia ?? p.stock ?? p.cantidad ?? 0;
          return p;
        });
        console.log('[DEBUG loadPosProducts] normalized items length:', Array.isArray(items)?items.length:typeof items);
        if(Array.isArray(items) && items.length>0) console.log('[DEBUG loadPosProducts] first item sample keys:', Object.keys(items[0]||{}));
      }catch(e){ items = []; }
      // fallback to list
      if(!items || !items.length){ const data = await apiFetch('/api/productos'); if(rawDebug===null) rawDebug = data; items = normalizeProducts(data); }
      console.log('[DEBUG loadPosProducts] final items count after fallback:', Array.isArray(items)?items.length:typeof items);
      // fill debug pre if present
      try{ const dbgPre = document.getElementById('posDebug'); if(dbgPre){ dbgPre.textContent = rawDebug ? JSON.stringify(rawDebug, null, 2) : JSON.stringify(items, null, 2); } }catch(e){}
      if(q){ // apply client-side filter as well
        const qq = String(q).toLowerCase(); items = items.filter(p=> (p.Nombre_comercial||p.nombre||'').toLowerCase().includes(qq) || (p.codigo||p.Cod_barrras||'').toLowerCase().includes(qq));
      }
      renderPosProductsTable(items);
    }catch(e){
      console.error('[ERROR loadPosProducts]', e);
      // show detailed error in UI and in debug pre so user can copy it
      const msg = (e && e.message) ? e.message : (typeof e === 'string' ? e : JSON.stringify(e));
      wrap.innerHTML = `<div class="alert error">Error cargando productos: ${String(msg).replace(/</g,'&lt;')}</div>`;
      try{
        const dbgPre = document.getElementById('posDebug');
        if(dbgPre){ dbgPre.style.display = 'block'; dbgPre.textContent = 'ERROR DETAILS:\n' + (e && e.data ? JSON.stringify(e.data, null, 2) : '') + '\n' + (e && e.stack ? e.stack : (typeof e === 'object' ? JSON.stringify(e, null, 2) : String(e))); }
      }catch(_){ }
    }
  }

  function formatDateIsoToLocal(d){ try{ if(!d) return ''; const dt = new Date(d); if(isNaN(dt)) return d; return dt.toLocaleDateString(); }catch(e){ return d; } }

  function daysTo(dateStr){ try{ if(!dateStr) return Infinity; const dt = new Date(dateStr); const now = new Date(); const diff = dt - now; return Math.ceil(diff / (1000*60*60*24)); }catch(e){ return Infinity; } }

  function renderPosProductsTable(items){
    const wrap = document.getElementById('posTableWrap');
    if(!items || !items.length){ wrap.innerHTML = '<div class="muted">No hay productos.</div>'; return; }
    let html = `<table class="table pos-products-table"><thead><tr><th>Nombre Comercial</th><th>Nombre Genérico</th><th>Acción Terapéutica</th><th>Marca</th><th style="width:110px">Precio Venta</th><th style="width:80px">Existencia</th><th style="width:120px">Vencimiento</th></tr></thead><tbody>`;
    for(const p of items){
      // safe coercions to avoid runtime errors when fields are objects or numbers
      const venc = p.vencimiento || p.Vencimiento || p.fecha_vencimiento || p.venc || '';
      const existencia = Number(p.existencia ?? p.stock ?? p.cantidad ?? 0) || 0;
      const price = Number(p.Precio_venta ?? p.precio ?? 0) || 0;
      const days = daysTo(venc);
      const vencClass = days <= 30 ? 'venc-warning' : (days <= 180 ? 'venc-soon' : 'venc-ok');
      const safeStr = (v)=>{ try{ if(v === null || v === undefined) return ''; if(typeof v === 'object') return JSON.stringify(v); return String(v); }catch(e){ return String(v); } };
      const nameStr = safeStr(p.Nombre_comercial || p.nombre || p.id || '');
      const nameAttr = nameStr.replace(/"/g,'&quot;');
      const genStr = safeStr(p.Nombre_generico || '');
      const accionStr = safeStr(p.Accion_terapeutica || '');
      const marcaStr = safeStr(p.Marca || p.id_marca || p.marca || '');
      const vencAttr = safeStr(venc);
      html += `<tr data-id="${safeStr(p.id)}" data-name="${nameAttr}" data-price="${price}" data-existencia="${existencia}" data-venc="${vencAttr}"><td>${nameStr}</td><td>${genStr}</td><td>${accionStr}</td><td>${marcaStr}</td><td>$${(Number(price) || 0).toFixed(2)}</td><td>${existencia}</td><td class="${vencClass}">${formatDateIsoToLocal(venc)}</td></tr>`;
    }
    html += '</tbody></table>';
    wrap.innerHTML = html;
    // attach dblclick: add to cart
    wrap.querySelectorAll('tbody tr').forEach(tr=>{
      tr.addEventListener('dblclick', ()=>{
        const id = tr.dataset.id; const name = tr.dataset.name; const price = parseFloat(tr.dataset.price||0); const existencia = parseFloat(tr.dataset.existencia||0);
        addToCart({ id_producto: id, nombre: name, cantidad: 1, precio_unitario: price, existencia });
      });
      // single click selects row
      tr.addEventListener('click', ()=>{ wrap.querySelectorAll('tbody tr').forEach(r=>r.classList.remove('selected')); tr.classList.add('selected'); });
    });
  }

  function addToCart(item){
    // enforce existencia (stock) when adding to cart
    const existencia = Number(item.existencia ?? 0);
    if(existencia <= 0){ alert('No hay existencia disponible para este producto'); return; }
    const existing = POS.items.find(i=>String(i.id_producto) === String(item.id_producto));
    if(existing){
      const newQty = (existing.cantidad||0) + (item.cantidad||1);
      if(newQty > existencia){ alert('Cantidad solicitada supera la existencia disponible. Se limitará a la existencia.'); existing.cantidad = existencia; }
      else existing.cantidad = newQty;
      existing.subtotal = existing.cantidad * existing.precio_unitario;
    } else {
      const qty = Math.min(item.cantidad||1, existencia);
      item.cantidad = qty;
      item.subtotal = qty * (item.precio_unitario||0);
      POS.items.push(item);
    }
    renderCart();
  }

  function renderCart(){
    const container = document.getElementById('cartContainer');
    if(!container) return;
    if(!POS.items.length){ container.innerHTML = `<div class="muted">Carrito vacío. Agrega productos desde la izquierda.</div>`; return; }
    let html = `<table class="cart-table"><thead><tr><th>Producto</th><th style="width:80px">Cant.</th><th style="width:120px">Precio</th><th style="width:100px">Subtotal</th><th style="width:80px">Acciones</th></tr></thead><tbody>`;
    for(const it of POS.items){ html += `<tr><td>${it.nombre||''}</td><td><input type="number" min="1" value="${it.cantidad||1}" data-id="${it.id_producto}" class="cart-qty" style="width:70px;padding:6px;border:1px solid #ddd;border-radius:6px"></td><td>$${(it.precio_unitario||0).toFixed(2)}</td><td>$${(it.subtotal||0).toFixed(2)}</td><td><button class="btn small" data-remove="${it.id_producto}">Quitar</button></td></tr>`; }
    html += `</tbody></table>`;
    const total = POS.items.reduce((s,i)=>s + (i.subtotal||0), 0);
    html += `<div class="cart-totals"><div><strong>Total: $${total.toFixed(2)}</strong></div><div style="margin-top:8px"><select id="cartClientSelect"><option value="">Seleccionar cliente</option></select></div><div style="margin-top:8px"><button id="btnCreateSale" class="btn">Generar Venta</button></div></div>`;
    container.innerHTML = html;
    // attach qty change
    container.querySelectorAll('.cart-qty').forEach(inp=>inp.addEventListener('change', (e)=>{
      const id = e.target.dataset.id; let val = parseInt(e.target.value)||1; const it = POS.items.find(x=>String(x.id_producto)===String(id));
      if(it){
        const max = Number(it.existencia ?? 0);
        if(val > max){ alert('La cantidad supera la existencia disponible. Se limitará a ' + max); val = max; e.target.value = String(max); }
        if(val < 1) { val = 1; e.target.value = '1'; }
        it.cantidad = val; it.subtotal = it.cantidad * it.precio_unitario; renderCart();
      }
    }));
    container.querySelectorAll('[data-remove]').forEach(b=>b.addEventListener('click', (e)=>{ const id = e.target.dataset.remove; POS.items = POS.items.filter(x=>String(x.id_producto)!==String(id)); renderCart(); }));
    // populate clients
    populateClientSelect();
    document.getElementById('btnCreateSale').addEventListener('click', ()=>{ openPaymentModal(); });
  }

  async function populateClientSelect(){
    try{
      const data = await apiFetch('/api/clientes'); const clients = Array.isArray(data)?data:(data?.clientes||[]);
      const sel = document.getElementById('cartClientSelect'); sel.innerHTML = '<option value="">Seleccionar cliente</option>' + clients.map(c=>`<option value="${c.id}">${c.nombre||c.name} (${c.ci||''})</option>`).join('');
    }catch(e){ /* ignore */ }
  }

  // Payment modal: collect recibido and confirm sale
  function openPaymentModal(){
    if(!POS.items.length){ alert('Carrito vacío'); return; }
    const total = POS.items.reduce((s,i)=>s + (i.subtotal||0), 0);
    const html = `
      <div class="modal-header"><h3>Generar Venta - Total $${total.toFixed(2)}</h3><button class="modal-close" id="payModalClose">×</button></div>
      <div class="modal-body">
        <div style="display:flex;flex-direction:column;gap:8px">
          <div>
            <label>Cliente (CI)</label>
            <div style="display:flex;gap:8px;align-items:center">
              <input id="payClientCI" placeholder="Ingresar CI (7-8 dígitos)" style="padding:8px;border:1px solid #ddd;border-radius:6px;width:200px">
              <button id="btnBuscarCI" class="btn small">Buscar</button>
              <div id="payClientInfo" style="margin-left:8px;color:#333"></div>
            </div>
            <input type="hidden" id="payClientId">
          </div>
          <div><label>Total a pagar:</label><div style="font-size:1.25rem;font-weight:700">$${total.toFixed(2)}</div></div>
          <div>
            <label>Método de pago</label>
            <div style="display:flex;gap:12px;align-items:center">
              <label><input type="radio" name="payMethod" value="efectivo" checked> Efectivo</label>
              <label><input type="radio" name="payMethod" value="tarjeta"> Tarjeta</label>
            </div>
          </div>
          <div id="payEfectivoRow"><label>Recibido:</label><input id="payRecibido" type="number" step="0.01" style="padding:8px;border:1px solid #ddd;border-radius:6px;width:200px" value="${total.toFixed(2)}"></div>
          <div><label>Cambio:</label><div id="payCambio" style="font-weight:700">$0.00</div></div>
          <div><label>Nota (opcional):</label><input id="payNota" type="text" style="padding:8px;border:1px solid #ddd;border-radius:6px;width:100%"></div>
        </div>
      </div>
      <div class="modal-footer"><button id="btnConfirmPay" class="btn">Confirmar y Generar Venta</button><button id="btnCancelPay" class="btn ghost">Cancelar</button></div>
    `;
    openModal(html);
    document.getElementById('payModalClose').addEventListener('click', closeModal);
    document.getElementById('btnCancelPay').addEventListener('click', closeModal);

    const ciInput = document.getElementById('payClientCI');
    const btnBuscar = document.getElementById('btnBuscarCI');
    const clientInfo = document.getElementById('payClientInfo');
    const clientIdInput = document.getElementById('payClientId');
    const recibidoInput = document.getElementById('payRecibido');
    const cambioEl = document.getElementById('payCambio');

    // helper: update cambio display
    function updateCambio(){
      const r = parseFloat(String(recibidoInput.value).replace(',', '.')) || 0;
      const c = r - total;
      cambioEl.textContent = '$' + c.toFixed(2);
      return c;
    }

    // search by CI when button clicked or when length 7-8 entered
    async function buscarPorCI(ci){
      if(!ci) return;
      try{
        clientInfo.textContent = 'Buscando...'; clientIdInput.value = '';
        const res = await apiFetch('/api/clientes/buscar-por-ci', { method:'POST', body: JSON.stringify({ ci }) }).catch(()=>null);
          if(res && res.id){
            clientInfo.textContent = (res.nombre || res.name || '') + (res.ci ? ' ('+res.ci+')' : '');
            clientIdInput.value = res.id;
          } else {
            // cliente no encontrado: mostrar UI inline para crear cliente (Nombre / Razón social)
            clientIdInput.value = '';
            clientInfo.innerHTML = `
              <span style="color:#b33">Cliente no encontrado.</span>
              <div style="margin-top:8px;display:flex;gap:8px;align-items:center">
                <input id="newClientNombre" placeholder="Nombre / Razón social" style="padding:8px;border:1px solid #ddd;border-radius:6px;flex:1">
                <button id="btnCreateClientQuick" class="btn small">Crear cliente</button>
              </div>
              <div id="newClientMsg" style="margin-top:6px;color:#666;font-size:0.95rem"></div>
            `;
            // wire create button
            document.getElementById('btnCreateClientQuick').addEventListener('click', async ()=>{
              const nombre = document.getElementById('newClientNombre').value.trim();
              const msgEl = document.getElementById('newClientMsg');
              if(!nombre){ msgEl.textContent = 'El nombre o razón social es requerido.'; return; }
              try{
                msgEl.textContent = 'Creando cliente...';
                const payload = { nombre, ci };
                const res2 = await apiFetch('/api/clientes', { method:'POST', body: JSON.stringify(payload) });
                const createdId = res2.id || res2._id || '';
                if(!createdId){ msgEl.textContent = 'Error: respuesta inválida del servidor.'; return; }
                clientIdInput.value = createdId;
                clientInfo.textContent = (res2.nombre || res2.name || nombre) + (res2.ci ? ' ('+res2.ci+')' : '');
                msgEl.textContent = 'Cliente creado ✓';
              }catch(err){ console.error('create client error', err); const m = err?.data?.error || err?.message || 'Error creando cliente'; document.getElementById('newClientMsg').textContent = m; }
            });
          }
      }catch(e){ clientInfo.textContent = 'Error buscando cliente'; clientIdInput.value = ''; }
    }

    btnBuscar.addEventListener('click', ()=>{ buscarPorCI(ciInput.value.trim()); });
    ciInput.addEventListener('input', debounce((e)=>{ const v = String(e.target.value||'').replace(/\D/g,''); if(v.length>=7 && v.length<=8) buscarPorCI(v); else { clientInfo.textContent = ''; clientIdInput.value = ''; } }, 300));

    // payment method toggle
    document.querySelectorAll('input[name="payMethod"]').forEach(r=> r.addEventListener('change', (e)=>{
      const val = e.target.value;
      if(val === 'tarjeta'){
        // tarjeta: assume recibido equals total, disable input
        recibidoInput.value = total.toFixed(2);
        recibidoInput.setAttribute('disabled','true');
        updateCambio();
      } else {
        recibidoInput.removeAttribute('disabled');
        recibidoInput.value = total.toFixed(2);
        updateCambio();
      }
    }));

    recibidoInput.addEventListener('input', updateCambio);
    updateCambio();

    document.getElementById('btnConfirmPay').addEventListener('click', async ()=>{
      // stock sanity check
      for(const it of POS.items){ const max = Number(it.existencia ?? 0); if(Number(it.cantidad) > max){ alert('La cantidad de "' + (it.nombre||'') + '" supera la existencia disponible. Ajusta el carrito antes de confirmar.'); return; } }

      let clientId = clientIdInput.value || document.getElementById('cartClientSelect')?.value || '';
      const ciVal = ciInput.value && String(ciInput.value).replace(/\D/g,'');
      if(!clientId && ciVal){
        // try final lookup
        await buscarPorCI(ciVal);
        clientId = clientIdInput.value;
      }
      if(!clientId){
        // show inline create-client UI inside the modal so the user can enter Nombre / Razón social
        clientInfo.innerHTML = `
          <div style="margin-top:8px;display:flex;gap:8px;align-items:center">
            <input id="newClientNombre" placeholder="Nombre / Razón social" style="padding:8px;border:1px solid #ddd;border-radius:6px;flex:1">
            <button id="btnCreateClientQuick" class="btn small">Crear cliente</button>
          </div>
          <div id="newClientMsg" style="margin-top:6px;color:#666;font-size:0.95rem"></div>
        `;
        // wire create button
        document.getElementById('btnCreateClientQuick').addEventListener('click', async ()=>{
          const nombre = document.getElementById('newClientNombre').value.trim();
          const msgEl = document.getElementById('newClientMsg');
          if(!nombre){ msgEl.textContent = 'El nombre o razón social es requerido.'; return; }
          try{
            msgEl.textContent = 'Creando cliente...';
            const payload = { nombre, ci: ciVal };
            const res = await apiFetch('/api/clientes', { method:'POST', body: JSON.stringify(payload) });
            const createdId = res.id || res._id || '';
            if(!createdId){ msgEl.textContent = 'Error: respuesta inválida del servidor.'; return; }
            clientId = createdId;
            clientIdInput.value = clientId;
            clientInfo.textContent = (res.nombre || res.name || nombre) + (res.ci ? ' ('+res.ci+')' : '');
            msgEl.textContent = 'Cliente creado ✓';
          }catch(err){ console.error('create client error', err); const m = err?.data?.error || err?.message || 'Error creando cliente'; document.getElementById('newClientMsg').textContent = m; }
        });
        // stop and let user create the client before confirming the sale
        return;
      }

      const recibido = parseFloat(String(recibidoInput.value).replace(',', '.')) || 0;
      const cambio = recibido - total;
      const items = POS.items.map(i=>({ id_producto: i.id_producto, cantidad: parseInt(i.cantidad), precio_unitario: parseFloat(i.precio_unitario), subtotal: parseFloat(i.subtotal) }));
      const body = { id_cliente: clientId, id_sucursal: POS.sucursal_id || 1, items, total, recibido, cambio, nota: document.getElementById('payNota').value };
      try{
          const res = await apiFetch('/api/facturas', { method:'POST', body: JSON.stringify(body) });
          showAlertToMain('Venta generada: ID '+(res?.id||'?') + (cambio>=0? ' | Cambio: $'+(cambio.toFixed(2)) : ''),'success');
          // show receipt modal (comprobante) with options to download TXT or print (save as PDF)
          try{
            const soldItems = items; // items local before clearing
            const clientName = clientInfo ? clientInfo.textContent : '';
            openReceiptModal(res, soldItems, clientName);
          }catch(_){ }
          // clear cart and close payment modal
          POS.items = []; renderCart(); closeModal();
          if(res && res.id) navigate('#/facturas/'+res.id);
      }catch(err){ console.error(err); const msg = err?.data?.error || err?.data || err?.message || JSON.stringify(err); showAlertToMain('Error generando venta: '+String(msg),'error'); }
    });
  }

    // Open a receipt modal (comprobante de pago) and allow TXT download or print
    function openReceiptModal(saleResp, items, clientName){
  const vendedor = saleResp?.vendedor_nombre || ((userNameEl && userNameEl.textContent) ? userNameEl.textContent : 'Vendedor');
      const id = saleResp?.id || saleResp?._id || '?';
      const total = saleResp?.total || items.reduce((s,i)=>s + (i.subtotal||0), 0);
      const recibido = saleResp?.recibido != null ? saleResp.recibido : '';
      const cambio = saleResp?.cambio != null ? saleResp.cambio : '';
      const nota = saleResp?.nota || '';
      const fecha = (new Date()).toLocaleString();

      // build HTML receipt for display/print
      let rows = '';
      for(const it of items){ rows += `<tr><td>${it.nombre||''}</td><td style="text-align:center">${it.cantidad}</td><td style="text-align:right">$${(it.precio_unitario||0).toFixed(2)}</td><td style="text-align:right">$${(it.subtotal||0).toFixed(2)}</td></tr>`; }

      const html = `
        <div class="modal-header"><h3>Comprobante de pago</h3><button class="modal-close" id="receiptClose">×</button></div>
        <div class="modal-body">
          <div style="font-family:monospace;">
            <div><strong>Comprobante ID:</strong> ${id}</div>
            <div><strong>Fecha:</strong> ${fecha}</div>
            <div><strong>Vendedor:</strong> ${vendedor}</div>
            <div><strong>Cliente:</strong> ${clientName || '-'}</div>
            <table style="width:100%;margin-top:8px;border-collapse:collapse">
              <thead><tr><th style="text-align:left">Producto</th><th style="width:60px">Cant.</th><th style="width:120px;text-align:right">Precio</th><th style="width:120px;text-align:right">Subtotal</th></tr></thead>
              <tbody>${rows}</tbody>
            </table>
            <div style="margin-top:8px;text-align:right"><strong>Total: $${Number(total||0).toFixed(2)}</strong></div>
            <div><strong>Recibido:</strong> $${recibido}</div>
            <div><strong>Cambio:</strong> $${cambio}</div>
            <div><strong>Nota:</strong> ${nota}</div>
          </div>
        </div>
        <div class="modal-footer">
          <button id="btnDownloadTxt" class="btn">Descargar TXT</button>
          <button id="btnPrintPdf" class="btn ghost">Imprimir / Guardar como PDF</button>
          <button id="btnCloseReceipt" class="btn ghost">Cerrar</button>
        </div>
      `;
      openModal(html);
      document.getElementById('receiptClose').addEventListener('click', closeModal);
      document.getElementById('btnCloseReceipt').addEventListener('click', closeModal);

      function generateReceiptText(){
        let out = '';
        out += `Comprobante ID: ${id}\n`;
        out += `Fecha: ${fecha}\n`;
        out += `Vendedor: ${vendedor}\n`;
        out += `Cliente: ${clientName || '-'}\n\n`;
        out += `Producto\tCant.\tPrecio\tSubtotal\n`;
        for(const it of items){ out += `${it.nombre||''}\t${it.cantidad}\t${(it.precio_unitario||0).toFixed(2)}\t${(it.subtotal||0).toFixed(2)}\n`; }
        out += `\nTotal: $${Number(total||0).toFixed(2)}\n`;
        out += `Recibido: $${recibido}\n`;
        out += `Cambio: $${cambio}\n`;
        out += `Nota: ${nota}\n`;
        return out;
      }

      document.getElementById('btnDownloadTxt').addEventListener('click', ()=>{
        const txt = generateReceiptText();
        const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `comprobante_${id}.txt`; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
      });

      document.getElementById('btnPrintPdf').addEventListener('click', ()=>{
        // open printable window and trigger print; user can choose "Save as PDF"
        const printWin = window.open('', '_blank');
        const style = `<style>body{font-family:Arial,Helvetica,sans-serif;padding:20px} table{width:100%;border-collapse:collapse} th,td{padding:6px;border-bottom:1px solid #ddd}</style>`;
        const content = `<h2>Comprobante de pago</h2><div><strong>ID:</strong> ${id}</div><div><strong>Fecha:</strong> ${fecha}</div><div><strong>Vendedor:</strong> ${vendedor}</div><div><strong>Cliente:</strong> ${clientName||'-'}</div>${'<table>' + '<thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr></thead><tbody>' + rows + '</tbody></table>' }<div style="text-align:right"><strong>Total: $${Number(total||0).toFixed(2)}</strong></div><div><strong>Recibido:</strong> $${recibido}</div><div><strong>Cambio:</strong> $${cambio}</div><div><strong>Nota:</strong> ${nota}</div>`;
        printWin.document.write(`<!doctype html><html><head><title>Comprobante ${id}</title>${style}</head><body>${content}</body></html>`);
        printWin.document.close();
        printWin.focus();
        // small timeout to ensure content loads
        setTimeout(()=>{ try{ printWin.print(); }catch(e){ console.error('print error', e); } }, 500);
      });
    }

  // Helpers
  function setUser(name){
    userNameEl.textContent = name || 'Invitado';
    if(name){ btnLogin.style.display='none'; btnLogout.style.display='inline-block'; }
    else { btnLogin.style.display='inline-block'; btnLogout.style.display='none'; }
  }

  function updateActiveNav(route){
    document.querySelectorAll('.sidebar a').forEach(a=>a.classList.remove('active'));
    const sel = `.sidebar a[href="#${route.split('?')[0]}"]`;
    const el = document.querySelector(sel);
    if(el) el.classList.add('active');
  }

  function showAlert(msg, type='error'){
    return `<div class="alert ${type}">${msg}</div>`;
  }

  // Pages
  async function renderInicio(){
    main.innerHTML = `<div class="page-header"><h2>Inicio</h2></div><div class="dashboard-grid">`+
      `<div class="stat card"><h3>Ventas (hoy)</h3><p class="big">$0.00</p></div>`+
      `<div class="stat card"><h3>Productos</h3><p class="big" id="stat-products">...</p></div>`+
      `<div class="stat card"><h3>Clientes</h3><p class="big" id="stat-clients">...</p></div>`+
      `<div class="stat card"><h3>Facturas</h3><p class="big" id="stat-invoices">...</p></div>`+
      `</div>`;
    // fetch counts (best-effort)
  try{ const products = await apiFetch('/api/productos'); const list = products?.productos || products || []; document.getElementById('stat-products').textContent = Array.isArray(list)?list.length:(list?.length||0); }catch(e){ document.getElementById('stat-products').textContent='-'; }
  try{ const clients = await apiFetch('/api/clientes'); const list = clients?.clientes || clients || []; document.getElementById('stat-clients').textContent = Array.isArray(list)?list.length:(list?.length||0); }catch(e){ document.getElementById('stat-clients').textContent='-'; }
  try{ const invoices = await apiFetch('/api/facturas'); const list = Array.isArray(invoices)?invoices:(invoices?.facturas||invoices||[]); document.getElementById('stat-invoices').textContent = Array.isArray(list)?list.length:(list?.length||0); }catch(e){ document.getElementById('stat-invoices').textContent='-'; }
  }

  async function renderProductos(route){
    // route could be /productos or /productos/create or /productos/edit/:id
    if(route === '/productos'){
      main.innerHTML = `<div class="page-header"><h2>Productos</h2><div class="actions"><button id="btnCreateProduct" class="btn">Nuevo</button></div></div><div id="productsList">Cargando...</div>`;
      document.getElementById('btnCreateProduct').addEventListener('click', ()=>{ openProductModal(); });
      try{
        const data = await apiFetch('/api/productos');
        const items = Array.isArray(data)?data:(data?.productos||[]);
        renderProductsTable(items);
      }catch(err){ document.getElementById('productsList').innerHTML = showAlert('No se pudieron cargar productos'); }
      return;
    }
    if(route === '/productos/create'){
      // support link-based opening
      openProductModal();
      return;
    }
    if(route.startsWith('/productos/edit')){
      const id = route.split('/').pop();
      openProductModal(id);
      return;
    }
  }

  function renderProductsTable(items){
    const table = document.createElement('table'); table.className='table';
    const thead = document.createElement('thead'); thead.innerHTML = '<tr><th style="width:6%">ID</th><th style="width:18%">Código</th><th>Nombre comercial</th><th style="width:12%">Precio</th><th style="width:18%">Acciones</th></tr>';
    const tbody = document.createElement('tbody');

    if(!items || !items.length){
      // empty table row but keep headers
      const tr = document.createElement('tr');
      tr.innerHTML = `<td colspan="5" style="text-align:center;color:#666;padding:18px">No hay productos todavía. Haz clic en "Nuevo" para crear uno.</td>`;
      tbody.appendChild(tr);
    } else {
      for(const p of items){
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${p.id ?? ''}</td><td>${p.codigo ?? ''}</td><td>${p.Nombre_comercial ?? ''}</td><td>${p.Precio_venta ?? ''}</td>`+
          `<td><button class="btn small" data-edit="${p.id}">Editar</button> <button class="btn small ghost" data-delete="${p.id}">Eliminar</button></td>`;
        tbody.appendChild(tr);
      }
    }

    table.appendChild(thead); table.appendChild(tbody);
    const container = document.getElementById('productsList'); container.innerHTML=''; container.appendChild(table);
    container.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click', e=>{ openProductModal(e.target.dataset.edit); }));
    container.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click', async e=>{
      const id = e.target.dataset.delete;
      const ok = confirm('Eliminar producto?');
      if(!ok) return;
      try{ await apiFetch('/api/productos/'+id, { method: 'DELETE' }); showAlertToMain('Producto eliminado','success'); await render(); }catch(err){ showAlertToMain('Error eliminando producto','error'); }
    }));
  }

  function showAlertToMain(msg, type='error'){
    main.insertAdjacentHTML('afterbegin', showAlert(msg, type));
  }

  // Modal-based product create/edit
  function closeModal(){
    const root = document.getElementById('modalRoot');
    if(!root) return;
    root.innerHTML = '';
    root.setAttribute('aria-hidden','true');
    document.body.classList.remove('modal-open');
  }

  function openModal(html){
    const root = document.getElementById('modalRoot');
    root.innerHTML = `
      <div class="modal-overlay" onclick="(function(e){ if(e.target.classList && e.target.classList.contains('modal-overlay')){ document.querySelector('#modalRoot') && document.querySelector('#modalRoot').__close && document.querySelector('#modalRoot').__close(); } })(event)"></div>
      <div class="modal" role="dialog" aria-modal="true">${html}</div>
    `;
    root.setAttribute('aria-hidden','false');
    document.body.classList.add('modal-open');
    // attach close helper
    root.__close = closeModal;
  }

  async function openProductModal(id, prefill){
    const isEdit = !!id;
    let product = { Nombre_comercial:'', Precio_venta: '', Presentacion: '' };
    let rawProductResp = null; // keep raw backend response for debugging/inspection
    let loadError = null;
    let loadStatus = null;
    if(isEdit){
      try{
        rawProductResp = await apiFetch('/api/productos/'+id);
        product = rawProductResp;
      }catch(e){
        // avoid showing a global alert which remains visible after modal close
        console.error('openProductModal: error cargando producto', e);
        try{
          // determine status if present
          loadStatus = (e && (e.status || (e.data && e.data.status))) || null;
          // Prefer structured, user-friendly messages instead of raw JSON
          if(loadStatus === 404){
            loadError = `Producto no encontrado (código: ${id})`;
          } else if(e && typeof e === 'object'){
            if(e.data && typeof e.data === 'object'){
              // backend may return { error: '...' } or similar
              loadError = e.data.error || e.data.message || JSON.stringify(e.data);
            } else if(typeof e.data === 'string'){
              loadError = e.data;
            } else if(e.message){
              loadError = e.message;
            } else if(e.status){
              loadError = `Error HTTP ${e.status}`;
            } else {
              loadError = JSON.stringify(e);
            }
          } else if(typeof e === 'string'){
            loadError = e;
          } else {
            loadError = String(e);
          }
        }catch(jsErr){
          loadError = String(e);
        }
        // trim very long payloads
        if(typeof loadError === 'string' && loadError.length > 500) loadError = loadError.slice(0,497) + '...';
        // keep default product so the code can still build the form if user wants to create a new one
        product = product;
      }
    }

    // Normalize product fields so the form inputs receive expected keys/formats
    function normalizeProductForForm(d){
        if(!d) return d;
        // unwrap common wrappers returned by different backends: { producto: {...} }, { data: {...} }, { product: {...} }
        let src = d;
        try{
          if(Array.isArray(d) && d.length) src = d[0];
          else if(d.producto) src = d.producto;
          else if(d.product) src = d.product;
          else if(d.data && (d.data.producto || d.data.product)) src = d.data.producto || d.data.product;
          else if(d.data && Object.keys(d.data).length === 1){ // sometimes backend returns { data: { <id>: {...} } }
            const vals = Object.values(d.data).filter(v=> v && typeof v === 'object'); if(vals.length) src = vals[0];
          }
        }catch(_){ src = d; }
        const p = Object.assign({}, src);
      // id handling
      if(!p.id){ if(p._id){ try{ if(typeof p._id === 'object' && p._id.$oid) p.id = p._id.$oid; else p.id = String(p._id); }catch(e){ p.id = String(p._id); } } else if(p.codigo) p.id = String(p.codigo); }
      // names
      p.Nombre_comercial = p.Nombre_comercial ?? p.nombre ?? p.name ?? '';
      p.Nombre_generico = p.Nombre_generico ?? p.nombre_generico ?? '';
      // prices
      p.Precio_venta = p.Precio_venta ?? p.precio ?? p.price ?? 0;
      p.Precio_compra = p.Precio_compra ?? p.precio_compra ?? 0;
      // barcodes / codes
      p.Cod_barrras = p.Cod_barrras ?? p.Cod_barras ?? p.codigo_barras ?? p.codigo ?? '';
      // inventory
      p.existencia = p.existencia ?? p.stock ?? p.cantidad ?? 0;
      // vencimiento
      p.vencimiento = p.vencimiento ?? p.Vencimiento ?? p.fecha_vencimiento ?? p.caducidad ?? '';
      // description
      p.Descripcion_larga = p.Descripcion_larga ?? p.Presentacion ?? p.descripcion ?? '';
      // boolean flags normalization
      const boolFields = ['Control_inventario','Receta_medica','Favorito','Granel','Medicamento_controlado','Solo_compra'];
      for(const f of boolFields){ p[f] = p[f] ? p[f] : 0; }
      return p;
    }

  product = normalizeProductForForm(product);
  // apply optional prefill (used when API returned 404 and user chose "Crear producto con este código")
  if(prefill && typeof prefill === 'object'){
    try{
      // prefer explicit fields, but only set when empty to avoid overwriting fetched values
      if(prefill.codigo){ product.codigo = product.codigo || String(prefill.codigo); product.Cod_barrras = product.Cod_barrras || String(prefill.codigo); }
      // allow mapping common names
      if(prefill.Cod_barrras) product.Cod_barrras = product.Cod_barrras || String(prefill.Cod_barrras);
      if(prefill.Nombre_comercial) product.Nombre_comercial = product.Nombre_comercial || String(prefill.Nombre_comercial);
      if(prefill.Precio_venta) product.Precio_venta = product.Precio_venta || Number(prefill.Precio_venta);
    }catch(_){ /* ignore */ }
  }
  // ensure codigo falls back to id when available
  if(!product.codigo && product.id) product.codigo = String(product.id);
  // if we failed fetching the product for edit, show a modal-specific error with retry option
  if(loadError){
    // sanitize display
    const safeMsg = String(loadError).replace(/</g,'&lt;');
    let footerButtons = `<button id="btnRetryLoad" class="btn">Reintentar</button><button id="btnCloseErr" class="btn ghost">Cerrar</button>`;
    // if server returned 404, offer to create a new product prefilled with the requested id/code
    const isNotFound = (loadStatus === 404) || (typeof loadError === 'string' && loadError.indexOf('404') !== -1);
    if(isNotFound){ footerButtons = `<button id="btnCreateFromId" class="btn">Crear producto con este código</button>` + footerButtons; }
    const errHtml = `
      <div class="modal-header"><h3>Error cargando producto</h3><button class="modal-close" id="modalErrClose">×</button></div>
      <div class="modal-body"><div class="alert error">No se pudo cargar el producto: ${safeMsg}</div></div>
      <div class="modal-footer">${footerButtons}</div>
    `;
    openModal(errHtml);
    document.getElementById('modalErrClose').addEventListener('click', closeModal);
    document.getElementById('btnCloseErr').addEventListener('click', closeModal);
    document.getElementById('btnRetryLoad').addEventListener('click', async ()=>{ closeModal(); await openProductModal(id); });
    if(isNotFound){
      document.getElementById('btnCreateFromId').addEventListener('click', ()=>{ closeModal(); openProductModal(null, { codigo: id }); });
    }
    return;
  }
    // build a full-form with all product fields from models.Product
    const val = (k)=>{ const v = product[k]; if(v===null||v===undefined) return ''; return String(v).replace(/"/g,'&quot;'); };
    const txt = (k)=>{ const v = product[k]; if(v===null||v===undefined) return ''; return String(v).replace(/</g,'&lt;'); };
    const chk = (k)=>{ return product[k] ? 'checked' : ''; };

    const html = `
      <div class="modal-header"><h3>${isEdit? 'Editar' : 'Crear'} Producto</h3><button class="modal-close" id="modalCloseBtn">×</button></div>
      <div class="modal-body">
        <form id="productModalForm">
          <div class="form-row">
            <div class="form-group"><label>Código</label><input name="codigo" required value="${val('codigo')}"></div>
            <div class="form-group"><label>Nombre comercial</label><input name="Nombre_comercial" required value="${val('Nombre_comercial')}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Código de barras</label><input name="Cod_barrras" value="${val('Cod_barrras')}"></div>
            <div class="form-group"><label>Nombre genérico</label><input name="Nombre_generico" value="${val('Nombre_generico')}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Acción terapéutica</label><input name="Accion_terapeutica" value="${val('Accion_terapeutica')}"></div>
            <div class="form-group"><label>Principio activo</label><input name="Principio_activo" value="${val('Principio_activo')}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Concentración</label><input name="Concentracion" value="${val('Concentracion')}"></div>
            <div class="form-group"><label>Presentación</label><input name="Presentacion" value="${val('Presentacion')}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Precio compra</label><input name="Precio_compra" type="number" step="0.01" value="${val('Precio_compra')}"></div>
            <div class="form-group"><label>Precio venta</label><input name="Precio_venta" type="number" step="0.01" value="${val('Precio_venta')}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Margen utilidad</label><input name="Margen_utilidad" type="number" step="0.01" value="${val('Margen_utilidad')}"></div>
            <div class="form-group"><label>Código impuesto</label><input name="Cod_imp_nacionales" value="${val('Cod_imp_nacionales')}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Cantidad mínima pedido</label><input name="Cantidad_minima_pedido" type="number" step="0.01" value="${val('Cantidad_minima_pedido')}"></div>
            <div class="form-group"><label>Cantidad máxima inventario</label><input name="Cantidad_maxima_inventario" type="number" step="0.01" value="${val('Cantidad_maxima_inventario')}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Tiempo sin movimiento (días)</label><input name="Tiempo_sin_movimiento" type="number" value="${val('Tiempo_sin_movimiento')}"></div>
            <div class="form-group"><label>Cantidad mínima inventario</label><input name="Cantidad_minima_inventario" type="number" step="0.01" value="${val('Cantidad_minima_inventario')}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Alerta caducidad (días)</label><input name="Alerta_caducidad_dias" type="number" value="${val('Alerta_caducidad_dias')}"></div>
            <div class="form-group"><label>Código Nandina</label><input name="Cod_nandina" value="${val('Cod_nandina')}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Subcategoría (id)</label><input name="id_subcategoria" type="number" value="${val('id_subcategoria')}"></div>
            <div class="form-group"><label>Forma farmacéutica (id)</label><input name="id_forma_farmaceutica" type="number" value="${val('id_forma_farmaceutica')}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Marca (id)</label><input name="id_marca" type="number" value="${val('id_marca')}"></div>
            <div class="form-group"><label>Laboratorio (id)</label><input name="id_laboratorio" type="number" value="${val('id_laboratorio')}"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label>Unidad medida (id)</label><input name="id_unidad_medida" type="number" value="${val('id_unidad_medida')}"></div>
            <div class="form-group"><label>Código interno</label><input name="Cod_imp_nacionales_2" style="display:none"></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label><input type="checkbox" name="Control_inventario" ${chk('Control_inventario')}> Control inventario</label></div>
            <div class="form-group"><label><input type="checkbox" name="Receta_medica" ${chk('Receta_medica')}> Receta médica</label></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label><input type="checkbox" name="Favorito" ${chk('Favorito')}> Favorito</label></div>
            <div class="form-group"><label><input type="checkbox" name="Granel" ${chk('Granel')}> Granel</label></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label><input type="checkbox" name="Medicamento_controlado" ${chk('Medicamento_controlado')}> Medicamento controlado</label></div>
            <div class="form-group"><label><input type="checkbox" name="Solo_compra" ${chk('Solo_compra')}> Solo compra</label></div>
          </div>
          <div class="form-group fullwidth"><label>Observaciones / Descripción larga</label><textarea name="Descripcion_larga">${txt('Descripcion_larga') || txt('Presentacion')}</textarea></div>
          <div class="modal-footer">
            <button type="button" id="btnViewRaw" class="btn ghost small" style="margin-right:8px; display:none">Ver respuesta cruda</button>
            <button type="submit" class="btn">Guardar</button>
            <button type="button" class="btn ghost" id="modalCancel">Cancelar</button>
          </div>
        </form>
      </div>`;
    openModal(html);

    // hook buttons
    document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
    document.getElementById('modalCancel').addEventListener('click', closeModal);
    const form = document.getElementById('productModalForm');
    // expose raw response viewer only when we have a raw response
    try{
      const btnRaw = document.getElementById('btnViewRaw');
      if(btnRaw){
        if(rawProductResp){
          btnRaw.style.display = 'inline-block';
          btnRaw.addEventListener('click', ()=>{
            const jsonText = JSON.stringify(rawProductResp, null, 2);
            const rawHtml = `<div class="modal-header"><h3>Respuesta cruda</h3><button class="modal-close" id="modalRawClose">×</button></div><div class="modal-body"><pre id="rawJsonPre" style="white-space:pre-wrap;max-height:70vh;overflow:auto;background:#f7f7f7;padding:8px;border-radius:6px;border:1px solid #eee">${String(jsonText).replace(/</g,'&lt;')}</pre></div><div class="modal-footer"><button class="btn" id="btnCopyRaw">Copiar JSON</button><button class="btn ghost" id="btnCloseRaw">Cerrar</button></div>`;
            openModal(rawHtml);
            document.getElementById('modalRawClose').addEventListener('click', closeModal);
            document.getElementById('btnCloseRaw').addEventListener('click', closeModal);
            document.getElementById('btnCopyRaw').addEventListener('click', async ()=>{
              try{
                await navigator.clipboard.writeText(jsonText);
                // provide a small visual feedback by temporarily changing button text
                const btn = document.getElementById('btnCopyRaw');
                const prev = btn.textContent;
                btn.textContent = 'Copiado ✓';
                setTimeout(()=>{ try{ btn.textContent = prev; }catch(_){ } }, 1500);
              }catch(err){
                console.error('Error copiando JSON al portapapeles', err);
                alert('Error copiando al portapapeles: ' + (err?.message||String(err)));
              }
            });
          });
        } else {
          btnRaw.style.display = 'none';
        }
      }
    }catch(_){ }
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const fd = new FormData(form);
      // construct body mapping all fields and casting types
      const body = {
        codigo: fd.get('codigo'),
        Nombre_comercial: fd.get('Nombre_comercial'),
        Cod_barrras: fd.get('Cod_barrras'),
        Nombre_generico: fd.get('Nombre_generico'),
        Accion_terapeutica: fd.get('Accion_terapeutica'),
        Principio_activo: fd.get('Principio_activo'),
        Concentracion: fd.get('Concentracion'),
        Presentacion: fd.get('Presentacion'),
        Precio_compra: isNaN(parseFloat(fd.get('Precio_compra')))?null:parseFloat(fd.get('Precio_compra')),
        Precio_venta: isNaN(parseFloat(fd.get('Precio_venta')))?null:parseFloat(fd.get('Precio_venta')),
        Margen_utilidad: isNaN(parseFloat(fd.get('Margen_utilidad')))?null:parseFloat(fd.get('Margen_utilidad')),
        Cod_imp_nacionales: fd.get('Cod_imp_nacionales'),
        Cantidad_minima_pedido: isNaN(parseFloat(fd.get('Cantidad_minima_pedido')))?null:parseFloat(fd.get('Cantidad_minima_pedido')),
        Cantidad_maxima_inventario: isNaN(parseFloat(fd.get('Cantidad_maxima_inventario')))?null:parseFloat(fd.get('Cantidad_maxima_inventario')),
        Tiempo_sin_movimiento: fd.get('Tiempo_sin_movimiento')?parseInt(fd.get('Tiempo_sin_movimiento')):null,
        Cantidad_minima_inventario: isNaN(parseFloat(fd.get('Cantidad_minima_inventario')))?null:parseFloat(fd.get('Cantidad_minima_inventario')),
        Alerta_caducidad_dias: fd.get('Alerta_caducidad_dias')?parseInt(fd.get('Alerta_caducidad_dias')):null,
        Cod_nandina: fd.get('Cod_nandina'),
        id_subcategoria: fd.get('id_subcategoria')?parseInt(fd.get('id_subcategoria')):null,
        id_forma_farmaceutica: fd.get('id_forma_farmaceutica')?parseInt(fd.get('id_forma_farmaceutica')):null,
        id_marca: fd.get('id_marca')?parseInt(fd.get('id_marca')):null,
        id_laboratorio: fd.get('id_laboratorio')?parseInt(fd.get('id_laboratorio')):null,
        id_unidad_medida: fd.get('id_unidad_medida')?parseInt(fd.get('id_unidad_medida')):null,
        Control_inventario: fd.get('Control_inventario')?1:0,
        Receta_medica: fd.get('Receta_medica')?1:0,
        Favorito: fd.get('Favorito')?1:0,
        Granel: fd.get('Granel')?1:0,
        Medicamento_controlado: fd.get('Medicamento_controlado')?1:0,
        Solo_compra: fd.get('Solo_compra')?1:0,
        Descripcion_larga: fd.get('Descripcion_larga') || fd.get('Presentacion')
      };
      try{
        if(isEdit) await apiFetch('/api/productos/'+id, { method:'PUT', body: JSON.stringify(body) });
        else await apiFetch('/api/productos', { method:'POST', body: JSON.stringify(body) });
        showAlertToMain('Guardado correctamente','success');
        closeModal();
        await render();
      }catch(err){ showAlertToMain('Error guardando producto','error'); }
    });
  }

  async function renderClientes(){
    main.innerHTML = `<div class="page-header"><h2>Clientes</h2></div><div id="clientsList">Cargando...</div>`;
    try{ const data = await apiFetch('/api/clientes'); const items = Array.isArray(data)?data:(data?.clientes||[]); renderClientsTable(items); }catch(e){ document.getElementById('clientsList').innerHTML = showAlert('No se pudieron cargar clientes'); }
  }
  function renderClientsTable(items){
    if(!items.length){ document.getElementById('clientsList').innerHTML='<p>No hay clientes.</p>'; return; }
    const table = document.createElement('table'); table.className='table';
    table.innerHTML = '<thead><tr><th>ID</th><th>Nombre</th><th>Documento</th></tr></thead>';
    const tbody = document.createElement('tbody');
    items.forEach(c=>{ const tr=document.createElement('tr'); tr.innerHTML = `<td>${c.id}</td><td>${c.name||c.nombre}</td><td>${c.document||c.dni||''}</td>`; tbody.appendChild(tr); });
    table.appendChild(tbody); document.getElementById('clientsList').innerHTML=''; document.getElementById('clientsList').appendChild(table);
  }

  async function renderFacturas(){
    main.innerHTML = `<div class="page-header"><h2>Facturas</h2></div><div id="invoicesList">Cargando...</div>`;
    try{ const data = await apiFetch('/api/facturas'); const items = Array.isArray(data)?data:(data?.facturas||[]); renderInvoicesTable(items); }catch(e){ document.getElementById('invoicesList').innerHTML = showAlert('No se pudieron cargar facturas'); }
  }

  /* ----------------- Compras (nuevo módulo) ----------------- */
  async function renderCompras(route){
    main.innerHTML = `<div class="page-header"><h2>Compras</h2><div class="actions"><button id="btnNewProveedor" class="btn">Nuevo proveedor</button><button id="btnNewCompra" class="btn ghost">Registrar compra</button></div></div><div id="comprasContent">Cargando...</div>`;
    document.getElementById('btnNewProveedor').addEventListener('click', ()=>{ openNewProveedorModal(); });
    document.getElementById('btnNewCompra').addEventListener('click', ()=>{ openNewCompraModal(); });
    // load lists
    await loadComprasList();
    await loadProveedoresList();
  }

  async function loadComprasList(){
    const el = document.getElementById('comprasContent'); if(!el) return; el.innerHTML = '<div class="card">Cargando compras...</div>';
    try{
      const data = await apiFetch('/api/compras').catch(()=>null);
      const items = Array.isArray(data)?data:(data?.compras||[]);
      let html = `<div class="card"><h4>Compras recientes</h4>`;
      if(!items || !items.length) html += `<p>No hay compras registradas.</p>`;
      else{
        html += `<table class="table"><thead><tr><th>ID</th><th>Proveedor</th><th>Total</th><th>Fecha</th></tr></thead><tbody>`;
        items.forEach(it=> html += `<tr><td>${it.id||''}</td><td>${it.proveedor_id||''}</td><td>${it.total||0}</td><td>${it.fecha||''}</td></tr>`);
        html += '</tbody></table>';
      }
      html += '</div><div id="comprasProveedores" class="card"></div>';
      el.innerHTML = html;
    }catch(e){ el.innerHTML = `<div class="alert error">Error cargando compras</div>`; }
  }

  async function loadProveedoresList(){
    const holder = document.getElementById('comprasProveedores'); if(!holder) return; holder.innerHTML = '<h4>Proveedores</h4><div>Cargando...</div>';
    try{
      const data = await apiFetch('/api/proveedores').catch(()=>null);
      const items = Array.isArray(data)?data:(data?.proveedores||[]);
      if(!items || !items.length) { holder.innerHTML = '<h4>Proveedores</h4><p>No hay proveedores.</p>'; return; }
      let html = `<h4>Proveedores</h4><table class="table"><thead><tr><th>ID</th><th>Nombre</th><th>Contacto</th></tr></thead><tbody>`;
      items.forEach(p=> html += `<tr><td>${p.id||''}</td><td>${p.nombre||p.name||''}</td><td>${p.contacto||p.telefono||''}</td></tr>`);
      html += '</tbody></table>';
      holder.innerHTML = html;
    }catch(e){ holder.innerHTML = `<div class="alert error">Error cargando proveedores</div>`; }
  }

  function openNewProveedorModal(){
    const html = `<div class="modal-header"><h3>Crear proveedor</h3><button class="modal-close" id="modalCloseProv">×</button></div><div class="modal-body"><form id="formProv"><div class="form-group"><label>Nombre</label><input name="nombre"></div><div class="form-group"><label>Contacto</label><input name="contacto"></div><div class="form-group"><label>Teléfono</label><input name="telefono"></div><div class="modal-footer"><button class="btn" type="submit">Crear</button><button class="btn ghost" type="button" id="cancelProv">Cancelar</button></div></form></div>`;
    openModal(html);
    document.getElementById('modalCloseProv').addEventListener('click', closeModal);
    document.getElementById('cancelProv').addEventListener('click', closeModal);
    document.getElementById('formProv').addEventListener('submit', async (e)=>{ e.preventDefault(); const fd=new FormData(e.target); const body = { nombre: fd.get('nombre'), contacto: fd.get('contacto'), telefono: fd.get('telefono') }; try{ await apiFetch('/api/proveedores', { method:'POST', body: JSON.stringify(body) }); showAlertToMain('Proveedor creado','success'); closeModal(); await loadProveedoresList(); }catch(err){ showAlertToMain('Error creando proveedor','error'); } });
  }

  function openNewCompraModal(){
    const html = `<div class="modal-header"><h3>Registrar compra</h3><button class="modal-close" id="modalCloseComp">×</button></div><div class="modal-body"><form id="formComp"><div class="form-group"><label>Proveedor (id)</label><input name="proveedor_id"></div><div class="form-group"><label>Items (JSON)</label><textarea name="items">[{"id_producto":"", "cantidad":1, "precio_unitario":0}]</textarea></div><div class="form-group"><label>Total</label><input name="total" type="number" step="0.01" value="0"></div><div class="modal-footer"><button class="btn" type="submit">Registrar</button><button class="btn ghost" type="button" id="cancelComp">Cancelar</button></div></form></div>`;
    openModal(html);
    document.getElementById('modalCloseComp').addEventListener('click', closeModal);
    document.getElementById('cancelComp').addEventListener('click', closeModal);
    document.getElementById('formComp').addEventListener('submit', async (e)=>{ e.preventDefault(); const fd=new FormData(e.target); const body = { proveedor_id: fd.get('proveedor_id'), items: JSON.parse(fd.get('items')||'[]'), total: parseFloat(fd.get('total')||0) }; try{ await apiFetch('/api/compras', { method:'POST', body: JSON.stringify(body) }); showAlertToMain('Compra registrada','success'); closeModal(); await loadComprasList(); }catch(err){ showAlertToMain('Error registrando compra','error'); } });
  }

  /* ----------------- Inventarios (nuevo módulo) ----------------- */
  async function renderInventarios(route){
    // route may be: /inventarios or /inventarios/overview|lotes|traspasos|pedidos|reportes|alertas
    const parts = (route || '').split('/');
    const sub = parts[2] || 'overview';
    main.innerHTML = `<div class="page-header"><h2>Inventarios</h2><div class="actions"><button id="btnNewTransfer" class="btn">Nuevo traspaso</button><button id="btnNewOrder" class="btn ghost">Nuevo pedido</button></div></div>`+
      `<div class="card" id="inventoryControls">
         <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px">
           <input id="invSearch" placeholder="Buscar por código o nombre..." style="flex:1;padding:8px;border:1px solid #ddd;border-radius:6px">
           <select id="invSucursalFilter" style="padding:8px;border:1px solid #ddd;border-radius:6px"><option value="">Todas las sucursales</option></select>
           <button id="btnNewProductInv" class="btn small">Nuevo producto</button>
         </div>
         <div id="inventoryTabs" class="inventory-tabs" style="margin-bottom:12px"></div>
         <div id="inventoryTabContent"></div>
       </div>`;

    document.getElementById('btnNewTransfer').addEventListener('click', ()=>openTransferModal());
    document.getElementById('btnNewOrder').addEventListener('click', ()=>openOrderModal());
  document.getElementById('btnNewProductInv').addEventListener('click', ()=>{ openProductModal(); });
    document.getElementById('invSearch').addEventListener('input', debounce(async (e)=>{ await loadInventoryOverview(e.target.value); }, 300));

    // create tabs
    const tabs = [
      {id:'overview', label:'Resumen / Kardex'},
      {id:'lotes', label:'Lotes / Caducidades'},
      {id:'traspasos', label:'Traspasos'},
      {id:'pedidos', label:'Pedidos'},
      {id:'reportes', label:'Reportes'},
      {id:'alertas', label:'Alertas'}
    ];
    const tabsEl = document.getElementById('inventoryTabs');
    tabsEl.innerHTML = tabs.map(t=>`<button class="btn small tab-btn" data-tab="${t.id}">${t.label}</button>`).join('');
    // clicking a tab navigates to the hash so routing and active nav stay consistent
    tabsEl.querySelectorAll('.tab-btn').forEach(b=>b.addEventListener('click', (e)=>{ const id=e.target.dataset.tab; navigate('#/inventarios/'+id); }));

    // load initial content based on route subpath
    switchInventoryTab(sub);
  }

  async function switchInventoryTab(tabId){
    document.querySelectorAll('.inventory-tabs .tab-btn').forEach(b=>b.classList.remove('active'));
    const btn = document.querySelector(`.inventory-tabs .tab-btn[data-tab="${tabId}"]`);
    if(btn) btn.classList.add('active');
    const content = document.getElementById('inventoryTabContent');
    content.innerHTML = '<div class="card">Cargando...</div>';
    try{
      if(tabId === 'overview') return await loadInventoryOverview();
      if(tabId === 'lotes') return await loadInventoryLotes();
      if(tabId === 'traspasos') return await loadInventoryTraspasos();
      if(tabId === 'pedidos') return await loadInventoryPedidos();
      if(tabId === 'reportes') return await loadInventoryReportes();
      if(tabId === 'alertas') return await loadInventoryAlertas();
    }catch(e){ content.innerHTML = `<div class="alert error">Error al cargar: ${e?.data?.error || e.message || JSON.stringify(e)}</div>`; }
  }

  async function loadInventoryOverview(q){
    const content = document.getElementById('inventoryTabContent');
    content.innerHTML = '<div class="card">Cargando resumen...</div>';
    try{
      const params = q ? `?q=${encodeURIComponent(q)}` : '';
      // backend placeholder endpoint: /api/inventarios/summary
      const data = await apiFetch('/api/inventarios' + params).catch(()=>null);
      const items = Array.isArray(data)?data:(data?.inventarios||[]);
      // simple table
      let html = `<table class="table"><thead><tr><th>ID</th><th>Código</th><th>Nombre</th><th>Stock</th><th>Últ. movimiento</th><th>Acciones</th></tr></thead><tbody>`;
      if(!items || !items.length){ html += `<tr><td colspan="6" style="text-align:center;color:#666;padding:18px">No se encontraron registros.</td></tr>`; }
      else{
        for(const it of items){
          html += `<tr><td>${it.id||''}</td><td>${it.codigo||''}</td><td>${it.Nombre_comercial||''}</td><td>${it.stock||it.cantidad||0}</td><td>${it.ultimo_movimiento||''}</td><td><button class="btn small" data-kardex="${it.id}">Kardex</button> <button class="btn small ghost" data-lotes="${it.id}">Lotes</button></td></tr>`;
        }
      }
      html += '</tbody></table>';
      content.innerHTML = html;
      // attach actions
      content.querySelectorAll('[data-kardex]').forEach(b=>b.addEventListener('click', e=>{ openKardexModal(e.target.dataset.kardex); }));
      content.querySelectorAll('[data-lotes]').forEach(b=>b.addEventListener('click', e=>{ openLotesModal(e.target.dataset.lotes); }));
    }catch(e){ content.innerHTML = `<div class="alert error">Error: ${e?.data?.error || e.message || JSON.stringify(e)}</div>`; }
  }

  async function loadInventoryLotes(){
    const content = document.getElementById('inventoryTabContent');
    content.innerHTML = '<div class="card">Cargando lotes y caducidades...</div>';
    try{
      const data = await apiFetch('/api/lotes').catch(()=>null);
      const items = Array.isArray(data)?data:(data?.lotes||[]);
      let html = `<table class="table"><thead><tr><th>ID</th><th>Producto</th><th>Lote</th><th>Caducidad</th><th>Cantidad</th></tr></thead><tbody>`;
      if(!items || !items.length) html += `<tr><td colspan="5" style="text-align:center;color:#666;padding:18px">No hay lotes registrados.</td></tr>`;
      else items.forEach(it=> html += `<tr><td>${it.id||''}</td><td>${it.producto||it.Nombre_comercial||''}</td><td>${it.lote||''}</td><td>${it.caducidad||''}</td><td>${it.cantidad||0}</td></tr>`);
      html += '</tbody></table>';
      content.innerHTML = html;
    }catch(e){ content.innerHTML = `<div class="alert error">Error cargando lotes</div>`; }
  }

  async function loadInventoryTraspasos(){
    const content = document.getElementById('inventoryTabContent');
    content.innerHTML = '<div class="card">Cargando traspasos...</div>';
    try{
      const data = await apiFetch('/api/traspasos').catch(()=>null);
      const items = Array.isArray(data)?data:(data?.traspasos||[]);
      let html = `<table class="table"><thead><tr><th>ID</th><th>Fecha</th><th>Origen</th><th>Destino</th><th>Items</th><th>Estado</th></tr></thead><tbody>`;
      if(!items || !items.length) html += `<tr><td colspan="6" style="text-align:center;color:#666;padding:18px">No hay traspasos.</td></tr>`;
      else items.forEach(it=> html += `<tr><td>${it.id||''}</td><td>${it.fecha||''}</td><td>${it.origen||''}</td><td>${it.destino||''}</td><td>${it.items?.length||0}</td><td>${it.estado||''}</td></tr>`);
      html += '</tbody></table>';
      content.innerHTML = html;
    }catch(e){ content.innerHTML = `<div class="alert error">Error cargando traspasos</div>`; }
  }

  async function loadInventoryPedidos(){
    const content = document.getElementById('inventoryTabContent');
    content.innerHTML = '<div class="card">Cargando pedidos...</div>';
    try{
      const data = await apiFetch('/api/pedidos').catch(()=>null);
      const items = Array.isArray(data)?data:(data?.pedidos||[]);
      let html = `<table class="table"><thead><tr><th>ID</th><th>Proveedor</th><th>Fecha</th><th>Items</th><th>Estado</th></tr></thead><tbody>`;
      if(!items || !items.length) html += `<tr><td colspan="5" style="text-align:center;color:#666;padding:18px">No hay pedidos.</td></tr>`;
      else items.forEach(it=> html += `<tr><td>${it.id||''}</td><td>${it.proveedor||''}</td><td>${it.fecha||''}</td><td>${it.items?.length||0}</td><td>${it.estado||''}</td></tr>`);
      html += '</tbody></table>';
      content.innerHTML = html;
    }catch(e){ content.innerHTML = `<div class="alert error">Error cargando pedidos</div>`; }
  }

  async function loadInventoryReportes(){
    const content = document.getElementById('inventoryTabContent');
    content.innerHTML = '<div class="card">Cargando reportes...</div>';
    try{
      // top movers endpoint
      const data = await apiFetch('/api/reportes/top-movers').catch(()=>null);
      const items = Array.isArray(data)?data:(data?.reportes||[]);
      let html = `<h4>Productos con mayor movimiento</h4>`;
      if(!items || !items.length) html += `<div class="card">No hay datos para mostrar.</div>`;
      else{
        html += `<table class="table"><thead><tr><th>Producto</th><th>Movimientos</th><th>Vendidos</th></tr></thead><tbody>`;
        items.forEach(it=> html += `<tr><td>${it.producto||''}</td><td>${it.movimientos||0}</td><td>${it.vendidos||0}</td></tr>`);
        html += '</tbody></table>';
      }
      content.innerHTML = html;
    }catch(e){ content.innerHTML = `<div class="alert error">Error cargando reportes</div>`; }
  }

  async function loadInventoryAlertas(){
    const content = document.getElementById('inventoryTabContent');
    content.innerHTML = '<div class="card">Cargando alertas...</div>';
    try{
      const data = await apiFetch('/api/inventarios/alertas').catch(()=>null);
      const items = Array.isArray(data)?data:(data?.alertas||[]);
      let html = `<h4>Alertas</h4>`;
      if(!items || !items.length) html += `<div class="card">No hay alertas.</div>`;
      else{
        html += `<table class="table"><thead><tr><th>Tipo</th><th>Producto</th><th>Detalle</th></tr></thead><tbody>`;
        items.forEach(it=> html += `<tr><td>${it.tipo||''}</td><td>${it.producto||''}</td><td>${it.detalle||''}</td></tr>`);
        html += '</tbody></table>';
      }
      content.innerHTML = html;
    }catch(e){ content.innerHTML = `<div class="alert error">Error cargando alertas</div>`; }
  }

  // small helpers for inventory actions
  function openKardexModal(productId){
    openModal(`<div class="modal-header"><h3>Kardex - Producto ${productId}</h3><button class="modal-close" id="modalCloseBtn">×</button></div><div class="modal-body"><div class="card">Cargando kardex...</div></div>`);
    document.getElementById('modalCloseBtn').addEventListener('click', closeModal);
    // TODO: call /api/inventarios/:id/kardex and render movements
  }

  function openLotesModal(productId){
    openModal(`<div class="modal-header"><h3>Lotes - Producto ${productId}</h3><button class="modal-close" id="modalCloseBtn2">×</button></div><div class="modal-body"><div class="card">Cargando lotes...</div></div>`);
    document.getElementById('modalCloseBtn2').addEventListener('click', closeModal);
    // TODO: call /api/lotes?producto_id=... and render
  }

  function openTransferModal(){
    const html = `<div class="modal-header"><h3>Nuevo traspaso</h3><button class="modal-close" id="modalCloseTr">×</button></div><div class="modal-body"><form id="formTr"><div class="form-group"><label>Origen (sucursal id)</label><input name="origen"></div><div class="form-group"><label>Destino (sucursal id)</label><input name="destino"></div><div class="form-group"><label>Items (JSON)</label><textarea name="items">[{"producto_id":1,"cantidad":10}]</textarea></div><div class="modal-footer"><button class="btn" type="submit">Enviar</button><button class="btn ghost" type="button" id="cancelTr">Cancelar</button></div></form></div>`;
    openModal(html);
    document.getElementById('modalCloseTr').addEventListener('click', closeModal);
    document.getElementById('cancelTr').addEventListener('click', closeModal);
    document.getElementById('formTr').addEventListener('submit', async (e)=>{
      e.preventDefault(); const fd = new FormData(e.target); const body = { origen: fd.get('origen'), destino: fd.get('destino'), items: JSON.parse(fd.get('items')) };
      try{ await apiFetch('/api/traspasos', { method:'POST', body: JSON.stringify(body) }); showAlertToMain('Traspaso creado','success'); closeModal(); await switchInventoryTab('traspasos'); }catch(err){ showAlertToMain('Error creando traspaso','error'); }
    });
  }

  function openOrderModal(){
    const html = `<div class="modal-header"><h3>Nuevo pedido a proveedor</h3><button class="modal-close" id="modalClosePo">×</button></div><div class="modal-body"><form id="formPo"><div class="form-group"><label>Proveedor</label><input name="proveedor"></div><div class="form-group"><label>Items (JSON)</label><textarea name="items">[{"producto_id":1,"cantidad":10}]</textarea></div><div class="modal-footer"><button class="btn" type="submit">Enviar</button><button class="btn ghost" type="button" id="cancelPo">Cancelar</button></div></form></div>`;
    openModal(html);
    document.getElementById('modalClosePo').addEventListener('click', closeModal);
    document.getElementById('cancelPo').addEventListener('click', closeModal);
    document.getElementById('formPo').addEventListener('submit', async (e)=>{
      e.preventDefault(); const fd = new FormData(e.target); const body = { proveedor: fd.get('proveedor'), items: JSON.parse(fd.get('items')) };
      try{ await apiFetch('/api/pedidos', { method:'POST', body: JSON.stringify(body) }); showAlertToMain('Pedido enviado','success'); closeModal(); await switchInventoryTab('pedidos'); }catch(err){ showAlertToMain('Error creando pedido','error'); }
    });
  }

  // utility: debounce
  function debounce(fn, wait){ let t; return function(...args){ clearTimeout(t); t = setTimeout(()=>fn.apply(this,args), wait); } }

  function renderInvoicesTable(items){
    if(!items.length){ document.getElementById('invoicesList').innerHTML='<p>No hay facturas.</p>'; return; }
    const table = document.createElement('table'); table.className='table';
    const thead = document.createElement('thead'); thead.innerHTML = '<tr><th>ID</th><th>Cliente</th><th>Total</th><th>Acciones</th></tr>';
    const tbody = document.createElement('tbody');
    items.forEach(i=>{
      const tr=document.createElement('tr');
      tr.innerHTML = `<td>${i.id}</td><td>${i.clientName||i.cliente||''}</td><td>${i.total||i.monto||''}</td><td><button class="btn ghost btnVerDetalle" data-id="${i.id}">Ver detalle</button></td>`;
      tbody.appendChild(tr);
    });
    table.appendChild(thead); table.appendChild(tbody); document.getElementById('invoicesList').innerHTML=''; document.getElementById('invoicesList').appendChild(table);
    // Delegar evento para los botones de detalle
    table.querySelectorAll('.btnVerDetalle').forEach(btn=>{
      btn.addEventListener('click', e=>{
        const id = btn.getAttribute('data-id');
        openFacturaDetalleModal(id);
      });
    });
  }

  // Modal para mostrar el detalle completo de una factura
  async function openFacturaDetalleModal(facturaId){
    try{
      // Prefer fetching the full factura (may include detalles) then render
      let factura = null;
      try{ factura = await apiFetch(`/api/facturas/${facturaId}`); }catch(_){ factura = null; }
      // If not found or doesn't include detalles, fallback to detalle endpoint
      let detalles = [];
      if(factura && factura.detalles && factura.detalles.length){ detalles = factura.detalles; }
      else {
        try{ detalles = await apiFetch(`/api/facturas/${facturaId}/detalle`); }catch(_){ detalles = []; }
      }

      // try to get cliente name if available
      let clienteNombre = '';
      try{
        const idc = factura && factura.id_cliente ? factura.id_cliente : (detalles && detalles.length ? detalles[0].id_cliente : null);
        if(idc){
          const clientsResp = await apiFetch('/api/clientes').catch(()=>null);
          const clients = Array.isArray(clientsResp)?clientsResp:(clientsResp?.clientes||[]);
          const found = (clients||[]).find(c => String(c.id||c._id||c._id)?.toString() === String(idc));
          if(found) clienteNombre = found.nombre || found.name || found.razon_social || '';
        }
      }catch(_){ clienteNombre = ''; }

      const vendedor = factura?.vendedor_nombre || factura?.id_usuario || '';
      const fecha = factura?.fecha || '';
      const recibido = factura?.recibido != null ? factura.recibido : '';
      const cambio = factura?.cambio != null ? factura.cambio : '';
      const nota = factura?.nota || '';

      let html = `<div class="modal-header"><h3>Detalle de factura</h3><button class="modal-close" id="modalCloseFactura">×</button></div><div class="modal-body">`;
      html += `<div><strong>ID:</strong> ${facturaId}</div>`;
      if(fecha) html += `<div><strong>Fecha:</strong> ${fecha}</div>`;
      if(vendedor) html += `<div><strong>Vendedor:</strong> ${vendedor}</div>`;
      if(clienteNombre) html += `<div><strong>Cliente:</strong> ${clienteNombre}</div>`;
      html += `<table class="table"><thead><tr><th>Producto</th><th>Cantidad</th><th>Precio unitario</th><th>Subtotal</th></tr></thead><tbody>`;
      let total = 0;
      for(const d of detalles){
        html += `<tr><td>${d.id_producto||d.producto||''}</td><td>${d.cantidad||''}</td><td>${d.precio_unitario||d.precio||''}</td><td>${d.subtotal||''}</td></tr>`;
        total += Number(d.subtotal||0);
      }
      html += `</tbody></table>`;
      html += `<div style="text-align:right"><strong>Total: $${total.toFixed(2)}</strong></div>`;
      if(recibido!=='') html += `<div><strong>Recibido:</strong> $${recibido}</div>`;
      if(cambio!=='') html += `<div><strong>Cambio:</strong> $${cambio}</div>`;
      if(nota) html += `<div><strong>Nota:</strong> ${nota}</div>`;
      html += `</div><div class="modal-footer"><button class="btn ghost" id="btnCerrarDetalleFactura">Cerrar</button></div>`;
      openModal(html);
      document.getElementById('modalCloseFactura').addEventListener('click', closeModal);
      document.getElementById('btnCerrarDetalleFactura').addEventListener('click', closeModal);
    }catch(e){
      console.error('openFacturaDetalleModal error', e);
      openModal(`<div class="modal-header"><h3>Error</h3></div><div class="modal-body"><div class="alert error">No se pudo cargar el detalle de la factura.</div></div><div class="modal-footer"><button class="btn ghost" onclick="closeModal()">Cerrar</button></div>`);
    }
  }

  function renderLogin(){
    main.innerHTML = `<div class="page-header"><h2>Iniciar sesión</h2></div>`+
      `<div class="card"><form id="loginForm"><div class="form-group"><label>Usuario</label><input name="username" required></div><div class="form-group"><label>Contraseña</label><input name="password" type="password" required></div><div class="actions"><button class="btn" type="submit">Entrar</button></div></form></div>`;
    document.getElementById('loginForm').addEventListener('submit', async e=>{
      e.preventDefault(); const f=e.target; try{
        // send credentials; backend sets session cookie via flask-login
        const res = await apiFetch('/api/login',{ method:'POST', body: JSON.stringify({ username: f.username.value, password: f.password.value, email: f.username.value }) });
        if(res && res.user){ setUser(res.user.nombre || res.user.email || res.user.username || 'Usuario'); navigate('#/inicio'); showAlertToMain('Login OK','success'); }
        else { showAlertToMain('Respuesta inválida','error'); }
      }catch(err){ showAlertToMain('Error autenticando','error'); }
    });
  }

  // auth buttons
  btnLogin.addEventListener('click', ()=>navigate('#/login'));
  btnLogout.addEventListener('click', async ()=>{ try{ await apiFetch('/api/logout',{ method:'POST' }); }catch(e){} setUser(null); navigate('#/login'); });

  // initialize
  window.addEventListener('hashchange', render);
  // initialize (session-based: start as guest)
  // Authentication modal shown before app render
  async function openAuthModal(){
    return new Promise((resolve, reject)=>{
      const html = `
        <div class="modal-header"><h3>Iniciar sesión</h3></div>
        <div class="modal-body">
          <form id="authForm">
            <div class="form-group"><label>Usuario</label><input name="username" required></div>
            <div class="form-group"><label>Contraseña</label><input name="password" type="password" required></div>
            <div class="form-group"><label>Recordarme</label><input type="checkbox" name="remember"></div>
            <div class="modal-footer"><button class="btn" type="submit">Entrar</button></div>
          </form>
        </div>`;
      openModal(html);
      const form = document.getElementById('authForm');
      form.addEventListener('submit', async (e)=>{
        e.preventDefault();
        const fd = new FormData(form);
        try{
          const res = await apiFetch('/api/login',{ method:'POST', body: JSON.stringify({ username: fd.get('username'), password: fd.get('password'), email: fd.get('username'), remember: !!fd.get('remember') }) });
          // Expect res.user with role information
          const user = res && res.user ? res.user : null;
          if(user){
            // close modal
            closeModal();
            // set user display
            setUser(user.nombre || user.email || user.username || 'Usuario');
            // determine role
            const role = user.role || user.rol || user.roles || user.privilegio || user.privilegios || null;
            if(Array.isArray(role)) CURRENT_USER_ROLE = role[0]; else if(typeof role === 'string') CURRENT_USER_ROLE = role; else CURRENT_USER_ROLE = user.is_admin ? 'admin' : (user.role_name || null);
            applyRolePermissions(CURRENT_USER_ROLE);
            resolve(user);
          } else {
            // show simple inline message
            const err = document.createElement('div'); err.className='alert error'; err.textContent='Usuario o contraseña incorrectos'; form.parentElement.insertBefore(err, form);
          }
        }catch(err){
          console.error('Login error', err);
          const msg = err?.data?.error || err?.data || err?.message || JSON.stringify(err);
          const errEl = document.createElement('div'); errEl.className='alert error'; errEl.textContent = String(msg);
          form.parentElement.insertBefore(errEl, form);
        }
      });
    });
  }

  (async function init(){
    setUser(null);
    // try to resume session: ask backend for current user; if none, show login modal
    try{
      const me = await apiFetch('/api/login').catch(()=>null);
      const user = me && me.user ? me.user : null;
      if(user){
        setUser(user.nombre || user.email || user.username || 'Usuario');
        const role = user.role || user.rol || user.roles || user.privilegio || user.privilegios || null;
        if(Array.isArray(role)) CURRENT_USER_ROLE = role[0]; else if(typeof role === 'string') CURRENT_USER_ROLE = role; else CURRENT_USER_ROLE = user.is_admin ? 'admin' : (user.role_name || null);
        applyRolePermissions(CURRENT_USER_ROLE);
      } else {
        await openAuthModal();
      }
    }catch(_){
      try{ await openAuthModal(); }catch(_){ }
    }
    if(!location.hash) location.hash = '#/inicio';
    await render();
  })();

})();
