import React, { useState, useEffect } from "react";

const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const AGENDA = {
  0: [
    { hora: "07:30", fin: "15:30", label: "💼 Trabajo", color: "#4a9eff" },
    { hora: "17:30", fin: "18:30", label: "🏋️ Gimnasio", color: "#ff6b35" },
    { hora: "19:30", fin: "21:00", label: "🥋 Jiu Jitsu", color: "#c084fc" },
  ],
  1: [
    { hora: "07:30", fin: "15:30", label: "💼 Trabajo", color: "#4a9eff" },
    { hora: "17:30", fin: "18:20", label: "🤸 Movilidad + Cardio", color: "#34d399" },
  ],
  2: [
    { hora: "07:30", fin: "15:30", label: "💼 Trabajo", color: "#4a9eff" },
    { hora: "17:30", fin: "18:30", label: "🏋️ Gimnasio", color: "#ff6b35" },
    { hora: "19:30", fin: "21:00", label: "🥋 Jiu Jitsu", color: "#c084fc" },
  ],
  3: [
    { hora: "07:30", fin: "15:30", label: "💼 Trabajo", color: "#4a9eff" },
    { hora: "17:30", fin: "18:20", label: "🤸 Movilidad + Cardio", color: "#34d399" },
  ],
  4: [
    { hora: "07:30", fin: "15:30", label: "💼 Trabajo", color: "#4a9eff" },
    { hora: "17:30", fin: "18:30", label: "🏋️ Gimnasio", color: "#ff6b35" },
    { hora: "19:30", fin: "21:00", label: "🥋 Jiu Jitsu", color: "#c084fc" },
  ],
  5: [
    { hora: "07:30", fin: "15:00", label: "💼 Trabajo", color: "#4a9eff" },
  ],
};

const TAREAS_INICIALES = [
  "Limpiar cocina",
  "Limpiar heladera",
  "Limpiar baño",
  "Limpiar pieza 1",
  "Limpiar pieza 2",
  "Limpiar sala",
  "Limpiar patio 1",
  "Limpiar patio 2",
  "Lavar ropa",
];

function getDiaHoy() {
  const d = new Date().getDay();
  if (d === 0) return -1;
  return d - 1;
}

function getSemana() {
  const d = new Date();
  const inicio = new Date(d.getFullYear(), 0, 1);
  return Math.ceil(((d - inicio) / 86400000 + inicio.getDay() + 1) / 7);
}

function mezclar(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i];
    a[i] = a[j];
    a[j] = tmp;
  }
  return a;
}

function generarDistribucion(listaTareas) {
  const pendientes = listaTareas.filter(function(t) { return !t.completada; });
  const mezcladas = mezclar(pendientes);
  const dist = {};
  let idx = 0;
  for (let d = 0; d < 6; d++) {
    dist[d] = [];
    for (let i = 0; i < 2 && idx < mezcladas.length; i++) {
      dist[d].push(mezcladas[idx].id);
      idx++;
    }
  }
  return dist;
}

function cargarStorage(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    if (val === null) return fallback;
    return JSON.parse(val);
  } catch (e) {
    return fallback;
  }
}

export default function App() {
  const diaHoy = getDiaHoy();

  const tareasIniciales = TAREAS_INICIALES.map(function(texto, i) {
    return { id: i + 1, texto: texto, completada: false };
  });

  const [tab, setTab] = useState("hoy");
  const [diaVista, setDiaVista] = useState(diaHoy >= 0 ? diaHoy : 0);
  const [tareas, setTareas] = useState(function() {
    return cargarStorage("msq_tareas", tareasIniciales);
  });
  const [checkeados, setCheckeados] = useState(function() {
    return cargarStorage("msq_checks", {});
  });
  const [distribucion, setDistribucion] = useState(function() {
    const semanaGuardada = cargarStorage("msq_semana", 0);
    const distGuardada = cargarStorage("msq_dist", null);
    if (distGuardada && semanaGuardada === getSemana()) return distGuardada;
    return null;
  });
  const [ingredientes, setIngredientes] = useState(function() {
    return cargarStorage("msq_ings", []);
  });
  const [receta, setReceta] = useState(function() {
    return cargarStorage("msq_receta", null);
  });
  const [cocinado, setCocinado] = useState(function() {
    const fecha = cargarStorage("msq_cocinado_fecha", "");
    return fecha === new Date().toDateString();
  });
  const [cargando, setCargando] = useState(false);
  const [nuevaTarea, setNuevaTarea] = useState("");
  const [agregandoTarea, setAgregandoTarea] = useState(false);
  const [nuevoIng, setNuevoIng] = useState({ nombre: "", cantidad: "", unidad: "gr" });
  const [agregandoIng, setAgregandoIng] = useState(false);

  useEffect(function() {
    if (!distribucion) {
      const d = generarDistribucion(tareas);
      setDistribucion(d);
      localStorage.setItem("msq_dist", JSON.stringify(d));
      localStorage.setItem("msq_semana", JSON.stringify(getSemana()));
    }
  }, []);

  useEffect(function() {
    localStorage.setItem("msq_tareas", JSON.stringify(tareas));
  }, [tareas]);

  useEffect(function() {
    localStorage.setItem("msq_checks", JSON.stringify(checkeados));
  }, [checkeados]);

  useEffect(function() {
    localStorage.setItem("msq_ings", JSON.stringify(ingredientes));
  }, [ingredientes]);

  useEffect(function() {
    if (receta) localStorage.setItem("msq_receta", JSON.stringify(receta));
  }, [receta]);

  function tareasDelDia(dia) {
    if (!distribucion || !distribucion[dia]) return [];
    return distribucion[dia].map(function(id) {
      return tareas.find(function(t) { return t.id === id; });
    }).filter(Boolean);
  }

  function toggleCheck(dia, tareaId) {
    const key = String(dia);
    const prev = checkeados[key] || [];
    let nuevos;
    if (prev.includes(tareaId)) {
      nuevos = prev.filter(function(x) { return x !== tareaId; });
    } else {
      nuevos = prev.concat([tareaId]);
    }
    setCheckeados(Object.assign({}, checkeados, { [key]: nuevos }));
  }

  function agregarTarea() {
    if (!nuevaTarea.trim()) return;
    const nueva = { id: Date.now(), texto: nuevaTarea.trim(), completada: false };
    const nuevaLista = tareas.concat([nueva]);
    setTareas(nuevaLista);
    const d = generarDistribucion(nuevaLista);
    setDistribucion(d);
    localStorage.setItem("msq_dist", JSON.stringify(d));
    localStorage.setItem("msq_semana", JSON.stringify(getSemana()));
    setNuevaTarea("");
    setAgregandoTarea(false);
  }

  function eliminarTarea(id) {
    const nuevaLista = tareas.filter(function(t) { return t.id !== id; });
    setTareas(nuevaLista);
    const d = generarDistribucion(nuevaLista);
    setDistribucion(d);
    localStorage.setItem("msq_dist", JSON.stringify(d));
    localStorage.setItem("msq_semana", JSON.stringify(getSemana()));
  }

  function agregarIngrediente() {
    if (!nuevoIng.nombre.trim() || !nuevoIng.cantidad) return;
    const existe = ingredientes.find(function(i) {
      return i.nombre.toLowerCase() === nuevoIng.nombre.toLowerCase();
    });
    if (existe) {
      setIngredientes(ingredientes.map(function(i) {
        if (i.nombre.toLowerCase() === nuevoIng.nombre.toLowerCase()) {
          return Object.assign({}, i, { cantidad: Number(i.cantidad) + Number(nuevoIng.cantidad) });
        }
        return i;
      }));
    } else {
      const nuevo = { id: Date.now(), nombre: nuevoIng.nombre.trim(), cantidad: Number(nuevoIng.cantidad), unidad: nuevoIng.unidad };
      setIngredientes(ingredientes.concat([nuevo]));
    }
    setNuevoIng({ nombre: "", cantidad: "", unidad: "gr" });
    setAgregandoIng(false);
  }

  function eliminarIngrediente(id) {
    setIngredientes(ingredientes.filter(function(i) { return i.id !== id; }));
  }

  async function pedirReceta() {
    if (ingredientes.length === 0) return;
    setCargando(true);
    const personas = diaVista === 5 ? 2 : 3;
    const lista = ingredientes.map(function(i) {
      return i.nombre + ": " + i.cantidad + " " + i.unidad;
    }).join(", ");
    const prompt = "Sos un cocinero experto argentino. Tengo estos ingredientes disponibles: " + lista + ". Necesito una receta para el almuerzo del mediodía para " + personas + " personas. Respondé SOLO en JSON sin backticks ni markdown, con este formato: {\"nombre\": \"nombre del plato\", \"tiempo\": \"30 minutos\", \"ingredientesUsados\": [{\"nombre\": \"...\", \"cantidad\": 100, \"unidad\": \"gr\"}], \"pasos\": [\"paso 1\", \"paso 2\"], \"consejo\": \"consejo corto\"}";
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const texto = data.content.map(function(c) { return c.text || ""; }).join("");
      const limpio = texto.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(limpio);
      setReceta(parsed);
    } catch (e) {
      console.error(e);
    }
    setCargando(false);
  }

  function marcarCocinado() {
    if (!receta) return;
    let ingsActualizados = ingredientes.slice();
    if (receta.ingredientesUsados) {
      receta.ingredientesUsados.forEach(function(usado) {
        ingsActualizados = ingsActualizados.map(function(i) {
          if (i.nombre.toLowerCase() === usado.nombre.toLowerCase()) {
            return Object.assign({}, i, { cantidad: Math.max(0, Number(i.cantidad) - Number(usado.cantidad)) });
          }
          return i;
        }).filter(function(i) { return i.cantidad > 0; });
      });
    }
    setIngredientes(ingsActualizados);
    setCocinado(true);
    localStorage.setItem("msq_cocinado_fecha", new Date().toDateString());
  }

  function redistribuir() {
    const d = generarDistribucion(tareas);
    setDistribucion(d);
    localStorage.setItem("msq_dist", JSON.stringify(d));
    localStorage.setItem("msq_semana", JSON.stringify(getSemana()));
  }

  // Estilos
  const estiloFondo = {
    minHeight: "100vh",
    background: "#0a0a0f",
    color: "#e8e4dc",
    fontFamily: "system-ui, sans-serif",
    paddingBottom: 90,
  };

  const estiloCard = {
    background: "#111118",
    borderRadius: 16,
    padding: 16,
    border: "1px solid #1e1e2e",
    marginBottom: 12,
  };

  const estiloTitulo = {
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 2,
    color: "#555",
    marginBottom: 12,
    textTransform: "uppercase",
  };

  const estiloBtnPrimario = {
    background: "linear-gradient(135deg, #c084fc, #4a9eff)",
    border: "none",
    borderRadius: 10,
    padding: "10px 18px",
    color: "#fff",
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
  };

  const estiloBtnSecundario = {
    background: "#1e1e2e",
    border: "none",
    borderRadius: 10,
    padding: "10px 18px",
    color: "#888",
    fontWeight: 600,
    fontSize: 13,
    cursor: "pointer",
  };

  const estiloInput = {
    width: "100%",
    background: "#0a0a0f",
    border: "1px solid #2a2a3e",
    borderRadius: 10,
    padding: "10px 14px",
    color: "#e8e4dc",
    fontSize: 14,
    boxSizing: "border-box",
    outline: "none",
    marginBottom: 8,
  };

  return (
    <div style={estiloFondo}>
      {/* Header */}
      <div style={{ padding: "24px 20px 0", background: "linear-gradient(180deg, #0d0d1a 0%, transparent 100%)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 4, color: "#555", marginBottom: 4 }}>MI SEMANA</div>
            <div style={{ fontSize: 26, fontWeight: 900, color: "#fff" }}>
              {diaHoy >= 0 ? DIAS[diaHoy] : "Domingo 🌿"}
            </div>
          </div>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: "linear-gradient(135deg, #c084fc, #4a9eff)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22,
          }}>🧠</div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
          {[
            { id: "hoy", label: "⚡ Hoy" },
            { id: "semana", label: "📅 Semana" },
            { id: "tareas", label: "✅ Tareas" },
            { id: "cocina", label: "🍳 Cocina" },
          ].map(function(t) {
            return (
              <button
                key={t.id}
                onClick={function() { setTab(t.id); }}
                style={{
                  padding: "8px 16px",
                  borderRadius: 100,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  background: tab === t.id ? "linear-gradient(135deg, #c084fc, #4a9eff)" : "#161620",
                  color: tab === t.id ? "#fff" : "#666",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido */}
      <div style={{ padding: "20px 20px 0" }}>

        {/* TAB HOY */}
        {tab === "hoy" && (
          <div>
            {diaHoy < 0 ? (
              <div style={estiloCard}>
                <div style={{ textAlign: "center", fontSize: 40, marginBottom: 12 }}>🌿</div>
                <div style={{ textAlign: "center", color: "#666" }}>Hoy es domingo. ¡Descansá!</div>
              </div>
            ) : (
              <div>
                <div style={estiloCard}>
                  <div style={estiloTitulo}>Agenda de hoy</div>
                  {(AGENDA[diaHoy] || []).map(function(act, i) {
                    return (
                      <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0", borderBottom: i < AGENDA[diaHoy].length - 1 ? "1px solid #1e1e2e" : "none" }}>
                        <div style={{ width: 4, height: 40, borderRadius: 4, background: act.color, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600 }}>{act.label}</div>
                          <div style={{ fontSize: 12, color: "#555" }}>{act.hora} — {act.fin}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div style={estiloCard}>
                  <div style={estiloTitulo}>Tareas del hogar</div>
                  {tareasDelDia(diaHoy).length === 0 ? (
                    <div style={{ color: "#555", fontSize: 14 }}>No hay tareas para hoy 🎉</div>
                  ) : tareasDelDia(diaHoy).map(function(tarea) {
                    const hecho = (checkeados[String(diaHoy)] || []).includes(tarea.id);
                    return (
                      <div
                        key={tarea.id}
                        onClick={function() { toggleCheck(diaHoy, tarea.id); }}
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", cursor: "pointer", borderBottom: "1px solid #1a1a28" }}
                      >
                        <div style={{
                          width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                          background: hecho ? "linear-gradient(135deg, #c084fc, #4a9eff)" : "transparent",
                          border: hecho ? "none" : "2px solid #333",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {hecho && <span style={{ color: "#fff", fontSize: 12 }}>✓</span>}
                        </div>
                        <span style={{ fontSize: 15, color: hecho ? "#444" : "#ddd", textDecoration: hecho ? "line-through" : "none" }}>
                          {tarea.texto}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB SEMANA */}
        {tab === "semana" && (
          <div>
            <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 16, paddingBottom: 4 }}>
              {DIAS.map(function(dia, idx) {
                return (
                  <button
                    key={idx}
                    onClick={function() { setDiaVista(idx); }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 10,
                      border: "none",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                      background: diaVista === idx ? "linear-gradient(135deg, #c084fc, #4a9eff)" : "#161620",
                      color: diaVista === idx ? "#fff" : "#666",
                      outline: idx === diaHoy ? "1px solid #4a9eff55" : "none",
                    }}
                  >
                    {dia.slice(0, 3)}
                    {idx === diaHoy ? " •" : ""}
                  </button>
                );
              })}
            </div>

            <div style={estiloCard}>
              <div style={estiloTitulo}>{DIAS[diaVista]}</div>
              {(AGENDA[diaVista] || []).map(function(act, i) {
                return (
                  <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "10px 0", borderBottom: "1px solid #1e1e2e" }}>
                    <div style={{ width: 4, height: 40, borderRadius: 4, background: act.color, flexShrink: 0 }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{act.label}</div>
                      <div style={{ fontSize: 12, color: "#555" }}>{act.hora} — {act.fin}</div>
                    </div>
                  </div>
                );
              })}
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, color: "#555", marginBottom: 8, letterSpacing: 1 }}>TAREAS DEL HOGAR</div>
                {tareasDelDia(diaVista).length === 0 ? (
                  <div style={{ color: "#444", fontSize: 13 }}>Sin tareas asignadas</div>
                ) : tareasDelDia(diaVista).map(function(t) {
                  const hecho = (checkeados[String(diaVista)] || []).includes(t.id);
                  return (
                    <div
                      key={t.id}
                      onClick={function() { toggleCheck(diaVista, t.id); }}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", cursor: "pointer" }}
                    >
                      <div style={{
                        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                        background: hecho ? "linear-gradient(135deg, #c084fc, #4a9eff)" : "transparent",
                        border: hecho ? "none" : "2px solid #333",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        {hecho && <span style={{ color: "#fff", fontSize: 10 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: 14, color: hecho ? "#444" : "#ccc", textDecoration: hecho ? "line-through" : "none" }}>
                        {t.texto}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB TAREAS */}
        {tab === "tareas" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: "#555" }}>{tareas.length} tareas</div>
              <button onClick={function() { setAgregandoTarea(!agregandoTarea); }} style={estiloBtnPrimario}>
                + Agregar
              </button>
            </div>

            {agregandoTarea && (
              <div style={estiloCard}>
                <input
                  value={nuevaTarea}
                  onChange={function(e) { setNuevaTarea(e.target.value); }}
                  onKeyDown={function(e) { if (e.key === "Enter") agregarTarea(); }}
                  placeholder="Nueva tarea del hogar..."
                  style={estiloInput}
                />
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={agregarTarea} style={estiloBtnPrimario}>Guardar</button>
                  <button onClick={function() { setAgregandoTarea(false); }} style={estiloBtnSecundario}>Cancelar</button>
                </div>
              </div>
            )}

            <div style={estiloCard}>
              {tareas.map(function(t, i) {
                return (
                  <div key={t.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < tareas.length - 1 ? "1px solid #1e1e2e" : "none" }}>
                    <span style={{ fontSize: 14 }}>{t.texto}</span>
                    <button onClick={function() { eliminarTarea(t.id); }} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 18 }}>✕</button>
                  </div>
                );
              })}
            </div>

            <div style={estiloCard}>
              <div style={estiloTitulo}>Distribución semanal</div>
              {DIAS.map(function(dia, i) {
                const tds = tareasDelDia(i);
                return (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: i < 5 ? "1px solid #1e1e2e" : "none" }}>
                    <div style={{ width: 30, fontSize: 11, color: "#555", paddingTop: 2, flexShrink: 0 }}>{dia.slice(0, 3)}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {tds.length === 0 ? (
                        <span style={{ fontSize: 12, color: "#333" }}>—</span>
                      ) : tds.map(function(t) {
                        return (
                          <span key={t.id} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 20, background: "#1e1e2e", color: "#777" }}>
                            {t.texto}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <button onClick={redistribuir} style={{ ...estiloBtnSecundario, marginTop: 12, width: "100%" }}>
                🔀 Redistribuir aleatoriamente
              </button>
            </div>
          </div>
        )}

        {/* TAB COCINA */}
        {tab === "cocina" && (
          <div>
            <div style={estiloCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div style={estiloTitulo}>🧺 Stock de ingredientes</div>
                <button onClick={function() { setAgregandoIng(!agregandoIng); }} style={estiloBtnPrimario}>+ Agregar</button>
              </div>

              {agregandoIng && (
                <div style={{ background: "#0f0f1a", borderRadius: 12, padding: 12, marginBottom: 14 }}>
                  <input
                    value={nuevoIng.nombre}
                    onChange={function(e) { setNuevoIng(Object.assign({}, nuevoIng, { nombre: e.target.value })); }}
                    placeholder="Ingrediente..."
                    style={estiloInput}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="number"
                      value={nuevoIng.cantidad}
                      onChange={function(e) { setNuevoIng(Object.assign({}, nuevoIng, { cantidad: e.target.value })); }}
                      placeholder="Cantidad"
                      style={{ ...estiloInput, flex: 1, marginBottom: 0 }}
                    />
                    <select
                      value={nuevoIng.unidad}
                      onChange={function(e) { setNuevoIng(Object.assign({}, nuevoIng, { unidad: e.target.value })); }}
                      style={{ ...estiloInput, flex: 1, marginBottom: 0 }}
                    >
                      {["gr", "kg", "ml", "lt", "unidad", "taza", "cdita"].map(function(u) {
                        return <option key={u} value={u}>{u}</option>;
                      })}
                    </select>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button onClick={agregarIngrediente} style={estiloBtnPrimario}>Guardar</button>
                    <button onClick={function() { setAgregandoIng(false); }} style={estiloBtnSecundario}>Cancelar</button>
                  </div>
                </div>
              )}

              {ingredientes.length === 0 ? (
                <div style={{ color: "#444", fontSize: 14 }}>Aún no cargaste ingredientes</div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {ingredientes.map(function(ing) {
                    return (
                      <div key={ing.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, background: "#161620", border: "1px solid #2a2a3e" }}>
                        <span style={{ fontSize: 13 }}>{ing.nombre}</span>
                        <span style={{ fontSize: 11, color: "#4a9eff" }}>{ing.cantidad}{ing.unidad}</span>
                        <button onClick={function() { eliminarIngrediente(ing.id); }} style={{ background: "none", border: "none", color: "#333", cursor: "pointer", fontSize: 12 }}>✕</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={estiloCard}>
              <div style={estiloTitulo}>👨‍🍳 Receta del día</div>
              <div style={{ fontSize: 12, color: "#555", marginBottom: 14 }}>
                Para {diaVista === 5 ? "2" : "3"} personas • Almuerzo
              </div>

              {!receta && !cargando && (
                <button
                  onClick={pedirReceta}
                  disabled={ingredientes.length === 0}
                  style={{ ...estiloBtnPrimario, width: "100%", padding: 14, fontSize: 15, opacity: ingredientes.length === 0 ? 0.4 : 1 }}
                >
                  ✨ {ingredientes.length === 0 ? "Primero cargá ingredientes" : "Sugerirme una receta"}
                </button>
              )}

              {cargando && (
                <div style={{ textAlign: "center", padding: 24, color: "#555" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>👨‍🍳</div>
                  <div style={{ fontSize: 14 }}>Pensando la receta perfecta...</div>
                </div>
              )}

              {receta && !cargando && (
                <div>
                  <div style={{ background: "linear-gradient(135deg, #1a1025, #0f1a2e)", borderRadius: 14, padding: 16, marginBottom: 14, border: "1px solid #2a1a3e" }}>
                    <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{receta.nombre}</div>
                    <div style={{ fontSize: 12, color: "#c084fc" }}>⏱ {receta.tiempo}</div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, letterSpacing: 2, color: "#555", marginBottom: 8 }}>INGREDIENTES A USAR</div>
                    {(receta.ingredientesUsados || []).map(function(ing, i) {
                      return (
                        <div key={i} style={{ fontSize: 13, color: "#aaa", padding: "4px 0" }}>
                          • {ing.nombre} — {ing.cantidad} {ing.unidad}
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 11, letterSpacing: 2, color: "#555", marginBottom: 8 }}>PREPARACIÓN</div>
                    {(receta.pasos || []).map(function(paso, i) {
                      return (
                        <div key={i} style={{ display: "flex", gap: 12, padding: "8px 0", borderBottom: "1px solid #1a1a2a" }}>
                          <div style={{ width: 22, height: 22, borderRadius: 6, background: "linear-gradient(135deg, #c084fc, #4a9eff)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, color: "#fff" }}>
                            {i + 1}
                          </div>
                          <div style={{ fontSize: 14, lineHeight: 1.5, color: "#ccc" }}>{paso}</div>
                        </div>
                      );
                    })}
                  </div>

                  {receta.consejo && (
                    <div style={{ background: "#0f1a0f", border: "1px solid #1a3a1a", borderRadius: 10, padding: 12, marginBottom: 14 }}>
                      <div style={{ fontSize: 12, color: "#34d399" }}>💡 Consejo del chef</div>
                      <div style={{ fontSize: 13, color: "#aaa", marginTop: 4 }}>{receta.consejo}</div>
                    </div>
                  )}

                  {!cocinado ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={marcarCocinado} style={{ ...estiloBtnPrimario, flex: 1, padding: 14 }}>
                        ✅ Marcar como cocinado
                      </button>
                      <button onClick={function() { setReceta(null); }} style={estiloBtnSecundario}>🔄</button>
                    </div>
                  ) : (
                    <div style={{ textAlign: "center", padding: 14, background: "#0f1a0f", borderRadius: 12, border: "1px solid #1a3a1a" }}>
                      <div style={{ fontSize: 24 }}>✅</div>
                      <div style={{ fontSize: 14, color: "#34d399", marginTop: 4 }}>¡Cocinado! Ingredientes descontados del stock.</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Barra inferior */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#0d0d18", borderTop: "1px solid #1a1a2e", display: "flex", padding: "10px 0 20px" }}>
        {[
          { id: "hoy", icon: "⚡", label: "Hoy" },
          { id: "semana", icon: "📅", label: "Semana" },
          { id: "tareas", icon: "✅", label: "Tareas" },
          { id: "cocina", icon: "🍳", label: "Cocina" },
        ].map(function(t) {
          return (
            <button
              key={t.id}
              onClick={function() { setTab(t.id); }}
              style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, color: tab === t.id ? "#c084fc" : "#444" }}
            >
              <span style={{ fontSize: 22 }}>{t.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 600 }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
