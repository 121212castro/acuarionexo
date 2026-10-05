/* AcuarioNexo · backend local temporal
 * Sustituye las operaciones básicas de Supabase mientras DATA_PROVIDER=local.
 * Los datos privados se guardan únicamente en este navegador.
 */
(function () {
  const PREFIX = 'anx_local_table_v1_';
  const SESSION_KEY = 'anx_local_session_v1';
  const libraryCache = { rows: null, promise: null };

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function tableKey(name) { return PREFIX + name; }

  function readTable(name) {
    try {
      const raw = localStorage.getItem(tableKey(name));
      return raw ? JSON.parse(raw) : [];
    } catch (_) { return []; }
  }

  function writeTable(name, rows) {
    try {
      localStorage.setItem(tableKey(name), JSON.stringify(rows || []));
      return true;
    } catch (error) {
      throw new Error('El almacenamiento local del navegador está lleno. Exporta o elimina datos antes de continuar.');
    }
  }

  async function loadLibrary() {
    if (libraryCache.rows) return clone(libraryCache.rows);
    if (!libraryCache.promise) {
      libraryCache.promise = fetch('data/library-fallback.json?v=' + encodeURIComponent(window.ANX_ACTIVE_BUILD || Date.now()), { cache: 'no-store' })
        .then(r => {
          if (!r.ok) throw new Error('No se pudo cargar la Biblioteca local.');
          return r.json();
        })
        .then(payload => {
          libraryCache.rows = Array.isArray(payload?.rows) ? payload.rows : [];
          return libraryCache.rows;
        })
        .finally(() => { libraryCache.promise = null; });
    }
    return clone(await libraryCache.promise);
  }

  async function getTable(name) {
    if (name === 'library_entries') return loadLibrary();
    return clone(readTable(name));
  }

  function now() { return new Date().toISOString(); }
  function id() { return globalThis.crypto?.randomUUID?.() || ('local-' + Date.now() + '-' + Math.random().toString(16).slice(2)); }

  function matchesFilter(row, filter) {
    const value = row?.[filter.column];
    if (filter.type === 'eq') return String(value ?? '') === String(filter.value ?? '');
    if (filter.type === 'neq') return String(value ?? '') !== String(filter.value ?? '');
    if (filter.type === 'in') return (filter.value || []).map(String).includes(String(value ?? ''));
    if (filter.type === 'is') return filter.value === null ? value == null : value === filter.value;
    if (filter.type === 'gte') return value >= filter.value;
    if (filter.type === 'lte') return value <= filter.value;
    if (filter.type === 'gt') return value > filter.value;
    if (filter.type === 'lt') return value < filter.value;
    if (filter.type === 'contains') {
      if (Array.isArray(value)) return (filter.value || []).every(x => value.includes(x));
      if (value && typeof value === 'object') return Object.entries(filter.value || {}).every(([k,v]) => value[k] === v);
      return false;
    }
    return true;
  }

  class LocalQuery {
    constructor(name) {
      this.name = name;
      this.filters = [];
      this.orders = [];
      this.limitCount = null;
      this.rangeValue = null;
      this.singleMode = false;
      this.maybeSingleMode = false;
      this.operation = 'select';
      this.payload = null;
    }
    select() { return this; }
    eq(column, value) { this.filters.push({type:'eq',column,value}); return this; }
    neq(column, value) { this.filters.push({type:'neq',column,value}); return this; }
    in(column, value) { this.filters.push({type:'in',column,value}); return this; }
    is(column, value) { this.filters.push({type:'is',column,value}); return this; }
    gte(column, value) { this.filters.push({type:'gte',column,value}); return this; }
    lte(column, value) { this.filters.push({type:'lte',column,value}); return this; }
    gt(column, value) { this.filters.push({type:'gt',column,value}); return this; }
    lt(column, value) { this.filters.push({type:'lt',column,value}); return this; }
    contains(column, value) { this.filters.push({type:'contains',column,value}); return this; }
    match(values) { Object.entries(values || {}).forEach(([column,value]) => this.eq(column,value)); return this; }
    order(column, options={}) { this.orders.push({column,ascending:options.ascending !== false,nullsFirst:options.nullsFirst === true}); return this; }
    limit(value) { this.limitCount = Number(value); return this; }
    range(from,to) { this.rangeValue = [Number(from),Number(to)]; return this; }
    single() { this.singleMode = true; return this; }
    maybeSingle() { this.maybeSingleMode = true; return this; }
    insert(payload) { this.operation='insert'; this.payload=payload; return this; }
    update(payload) { this.operation='update'; this.payload=payload; return this; }
    delete() { this.operation='delete'; return this; }
    upsert(payload) { this.operation='upsert'; this.payload=payload; return this; }

    async execute() {
      try {
        if (this.name === 'library_entries' && this.operation !== 'select') {
          throw new Error('La Biblioteca local es de solo lectura mientras Supabase está desconectado.');
        }
        let all = await getTable(this.name);
        const selectedIndexes = [];
        all.forEach((row,index) => {
          if (this.filters.every(f => matchesFilter(row,f))) selectedIndexes.push(index);
        });
        let result;

        if (this.operation === 'insert') {
          const incoming = Array.isArray(this.payload) ? this.payload : [this.payload];
          const created = incoming.map(item => ({ id: item?.id || id(), created_at: item?.created_at || now(), updated_at: item?.updated_at || now(), ...clone(item) }));
          all.push(...created);
          writeTable(this.name, all);
          result = created;
        } else if (this.operation === 'update') {
          const updated = [];
          selectedIndexes.forEach(index => {
            all[index] = { ...all[index], ...clone(this.payload), updated_at: this.payload?.updated_at || now() };
            updated.push(all[index]);
          });
          writeTable(this.name, all);
          result = updated;
        } else if (this.operation === 'delete') {
          const selected = new Set(selectedIndexes);
          result = all.filter((_row,index) => selected.has(index));
          all = all.filter((_row,index) => !selected.has(index));
          writeTable(this.name, all);
        } else if (this.operation === 'upsert') {
          const incoming = Array.isArray(this.payload) ? this.payload : [this.payload];
          const changed = [];
          incoming.forEach(item => {
            const idx = all.findIndex(row => item?.id && String(row.id) === String(item.id));
            if (idx >= 0) {
              all[idx] = { ...all[idx], ...clone(item), updated_at: now() };
              changed.push(all[idx]);
            } else {
              const created = { id:item?.id || id(), created_at:item?.created_at || now(), updated_at:now(), ...clone(item) };
              all.push(created); changed.push(created);
            }
          });
          writeTable(this.name, all);
          result = changed;
        } else {
          result = selectedIndexes.map(index => all[index]);
        }

        for (const sort of this.orders.slice().reverse()) {
          result.sort((a,b) => {
            const av=a?.[sort.column], bv=b?.[sort.column];
            if (av == null && bv == null) return 0;
            if (av == null) return sort.nullsFirst ? -1 : 1;
            if (bv == null) return sort.nullsFirst ? 1 : -1;
            const cmp = typeof av === 'number' && typeof bv === 'number'
              ? av-bv
              : String(av).localeCompare(String(bv),'es',{numeric:true,sensitivity:'base'});
            return sort.ascending ? cmp : -cmp;
          });
        }
        if (this.rangeValue) result = result.slice(this.rangeValue[0], this.rangeValue[1]+1);
        if (Number.isFinite(this.limitCount)) result = result.slice(0,this.limitCount);

        if (this.singleMode || this.maybeSingleMode) {
          if (!result.length && this.singleMode) return { data:null, error:new Error('No se encontró el registro local.') };
          return { data:result[0] || null, error:null };
        }
        return { data:clone(result), error:null, count:result.length };
      } catch (error) {
        return { data:null, error };
      }
    }
    then(resolve,reject) { return this.execute().then(resolve,reject); }
  }

  function localUser() {
    return { id:'local-owner', email:'local@acuarionexo.app', user_metadata:{ local_mode:true }, app_metadata:{ provider:'local' } };
  }

  function getLocalSession() {
    try {
      const saved=JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
      if (saved?.user) return saved;
    } catch (_) {}
    const session={ access_token:'local-session', token_type:'bearer', user:localUser() };
    try { localStorage.setItem(SESSION_KEY,JSON.stringify(session)); } catch (_) {}
    return session;
  }

  function createClient() {
    const authListeners = new Set();
    const auth = {
      async getSession() { return { data:{ session:getLocalSession() }, error:null }; },
      async getUser() { return { data:{ user:getLocalSession().user }, error:null }; },
      async signInWithPassword() {
        const session=getLocalSession();
        authListeners.forEach(cb => { try { cb('SIGNED_IN',session); } catch (_) {} });
        return { data:{ session,user:session.user }, error:null };
      },
      async signUp() {
        const session=getLocalSession();
        return { data:{ session,user:session.user }, error:null };
      },
      async signOut() {
        try { localStorage.removeItem(SESSION_KEY); } catch (_) {}
        authListeners.forEach(cb => { try { cb('SIGNED_OUT',null); } catch (_) {} });
        return { error:null };
      },
      async resetPasswordForEmail() { return { data:{}, error:new Error('La recuperación por email está desactivada en modo local.') }; },
      async updateUser() { return { data:{ user:getLocalSession().user }, error:null }; },
      onAuthStateChange(callback) {
        authListeners.add(callback);
        return { data:{ subscription:{ unsubscribe(){ authListeners.delete(callback); } } } };
      }
    };

    return {
      __local:true,
      from(name) { return new LocalQuery(name); },
      auth,
      rpc(name) {
        const defaults = {
          has_app_access:true,
          can_register_email:true,
          app_entitlements:{ plan:'local', aquarium_limit:null, ai_allowed:false },
          is_admin:false,
          get_admin_role:null
        };
        return Promise.resolve({ data:Object.prototype.hasOwnProperty.call(defaults,name) ? clone(defaults[name]) : null, error:null });
      },
      functions:{
        async invoke() { return { data:null, error:new Error('Esta función online está desactivada temporalmente en modo local.') }; }
      },
      storage:{
        from(){
          return {
            async upload(){ return { data:null, error:new Error('La subida de archivos se activará en R2; Supabase Storage está desconectado.') }; },
            getPublicUrl(){ return { data:{ publicUrl:'' } }; },
            async createSignedUrl(){ return { data:null, error:new Error('Supabase Storage está desconectado.') }; }
          };
        }
      }
    };
  }


  function importBackup(payload) {
    const tables = payload?.tables || payload || {};
    const allowed = [
      'aquariums','animals','aquarium_photos','aquarium_measurements','inventory_items','tasks',
      'maintenance_events','water_changes','water_change_history','aquarium_water_changes','microfauna_cultures'
    ];
    let imported = 0;
    for (const name of allowed) {
      if (!Array.isArray(tables[name])) continue;
      const existing = readTable(name);
      const byId = new Set(existing.map(row => String(row?.id || '')).filter(Boolean));
      for (const sourceRow of tables[name]) {
        if (!sourceRow || typeof sourceRow !== 'object' || Array.isArray(sourceRow)) continue;
        const row = clone(sourceRow);
        if (row.user_id) row.user_id = 'local-owner';
        const rowId = String(row.id || '');
        if (rowId && byId.has(rowId)) continue;
        existing.push(row);
        if (rowId) byId.add(rowId);
        imported += 1;
      }
      writeTable(name, existing);
    }
    return imported;
  }

  function exportBackup() {
    const tables = {};
    for (const name of ['aquariums','animals','aquarium_photos','aquarium_measurements','inventory_items','tasks','maintenance_events','water_changes','water_change_history','aquarium_water_changes','microfauna_cultures']) {
      tables[name] = readTable(name);
    }
    return { format:'acuarionexo-local-backup-v1', exported_at:new Date().toISOString(), tables };
  }

  window.ANXLocalBackend = { createClient, getTable, readTable, writeTable, loadLibrary, importBackup, exportBackup };
})();