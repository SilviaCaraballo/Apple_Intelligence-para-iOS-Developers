const { useState, useEffect } = React;

// ── Swift syntax highlighter ──────────────────────────────────────────────────
function hl(raw) {
  const KW = 'import|struct|class|enum|actor|func|var|let|if|else|guard|return|async|await|throws|try|for|in|while|switch|case|break|continue|nil|true|false|self|init|static|private|public|internal|fileprivate|open|rethrows|some|any|associatedtype|protocol|extension|where|inout|mutating|nonmutating|final|required|convenience|subscript|weak|unowned|lazy|indirect|dynamic';
  const escaped = raw.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const comments = [], strings = [];
  let r = escaped;
  r = r.replace(/(^\/\/[^\n]*)/gm, m => { comments.push(m); return `\x00C${comments.length-1}\x00`; });
  r = r.replace(/("(?:[^"\\]|\\.)*")/g, m => { strings.push(m); return `\x00S${strings.length-1}\x00`; });
  r = r.replace(/(@\w+)/g,'<span class="a">$1</span>');
  r = r.replace(new RegExp(`\\b(${KW})\\b`,'g'),'<span class="k">$1</span>');
  r = r.replace(/\b([A-Z][a-zA-Z0-9_]+)\b/g,'<span class="t">$1</span>');
  r = r.replace(/\b(\d+\.?\d*)\b/g,'<span class="n">$1</span>');
  strings.forEach((s,i) => { r = r.split(`\x00S${i}\x00`).join(`<span class="s">${s}</span>`); });
  comments.forEach((c,i) => { r = r.split(`\x00C${i}\x00`).join(`<span class="c">${c}</span>`); });
  return r;
}

// ── Shared UI components ──────────────────────────────────────────────────────
function CodeBlock({ filename, code }) {
  return (
    <div className="code-block">
      <div className="code-header">
        <div className="code-dots">
          <div className="code-dot" style={{background:'#FF5F57'}}/>
          <div className="code-dot" style={{background:'#FEBC2E'}}/>
          <div className="code-dot" style={{background:'#28C840'}}/>
        </div>
        <span className="code-filename">{filename}</span>
        <span style={{width:44}}/>
      </div>
      <div className="code-body">
        <pre dangerouslySetInnerHTML={{__html: hl(code)}}/>
      </div>
    </div>
  );
}

function Callout({ type='info', title, children }) {
  const icons = { tip:'💡', info:'ℹ️', warn:'⚠️' };
  return (
    <div className={`callout callout-${type}`}>
      <div className="ct">{icons[type]} {title}</div>
      <p>{children}</p>
    </div>
  );
}

function Card({ icon, title, desc }) {
  return (
    <div className="card">
      <span className="card-icon">{icon}</span>
      <h4>{title}</h4>
      <p>{desc}</p>
    </div>
  );
}

// ── HERO ─────────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <div className="hero">
      <div className="container">
        <div className="hero-tag"><span className="dot"/>&nbsp; iOS 18 · Swift 6 · Apple Intelligence</div>
        <h1>Apple Intelligence<br/>para iOS Developers</h1>
        <p className="hero-sub">
          Domina las cinco APIs de Apple Intelligence — App Intents, Writing Tools, Image Playground,
          Core ML y Natural Language — construyendo <strong style={{color:'var(--text)'}}>NoteAssist</strong> paso a paso.
        </p>
        <div className="hero-meta">
          <span>📖 Lectura ~30 min</span>
          <span>⚡ Swift 6 + iOS 18</span>
          <span>🏗️ Proyecto completo</span>
          <span>🔒 Zero dependencias de terceros</span>
        </div>
        <div className="hero-badges">
          {['App Intents','Writing Tools','Image Playground','Core ML','Natural Language'].map(t=>(
            <span key={t} className="badge">{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── INTRO ────────────────────────────────────────────────────────────────────────
function Intro() {
  return (
    <section className="section" style={{borderTop:'none',paddingTop:'2.5rem'}}>
      <div className="container">
        <div className="prose">
          <p>
            Apple Intelligence no es solo un conjunto de características del sistema operativo.
            Es una <strong>plataforma de APIs diseñada para que cualquier developer integre IA
            nativa</strong> en sus apps: segura, privada y optimizada para el hardware de Apple.
          </p>
          <p>
            A lo largo de este artículo construiremos <strong>NoteAssist</strong>, una app de notas
            inteligente que incorpora las cinco tecnologías principales. Cada sección es un módulo
            independiente que puedes extraer y usar en tus propios proyectos.
          </p>
          <p>
            Todo el código usa <strong>Swift 6 strict concurrency</strong>: actores para el
            aislamiento de estado, <code>@MainActor</code> para las operaciones de UI, y la macro
            <code>@Observable</code> para ViewModels reactivos con la mínima fricción posible.
          </p>
        </div>
        <div className="cards" style={{marginTop:'1.75rem'}}>
          <Card icon="🎙️" title="Siri nativo" desc="Crea y busca notas con voz mediante App Intents, sin configuración adicional del usuario."/>
          <Card icon="✨" title="Escritura inteligente" desc="Writing Tools integrado para reescribir, resumir y corregir notas con un tap."/>
          <Card icon="🖼️" title="Imágenes AI" desc="Genera ilustraciones on-device basadas en el contenido de cada nota."/>
          <Card icon="🏷️" title="Auto-clasificación" desc="Core ML categoriza las notas: trabajo, personal, ideas o tareas."/>
          <Card icon="🔬" title="Insights de texto" desc="Natural Language extrae entidades, sentimiento y palabras clave."/>
        </div>
      </div>
    </section>
  );
}

// ── SECTION 1: App Intents ───────────────────────────────────────────────────────
function AppIntentsSection() {
  const codeModel = `import Foundation\n\n// MARK: - Modelo base de NoteAssist\n\nstruct Note: Identifiable, Sendable {\n    let id: UUID\n    var title: String\n    var content: String\n    var createdAt: Date\n\n    init(title: String, content: String) {\n        self.id = UUID()\n        self.title = title\n        self.content = content\n        self.createdAt = Date()\n    }\n}`;

  const codeCreate = `import AppIntents\n\n// MARK: - Intent para crear una nota\n\nstruct CreateNoteIntent: AppIntent {\n    static var title: LocalizedStringResource = "Crear Nota"\n    static var description = IntentDescription(\n        "Crea una nueva nota inteligente en NoteAssist",\n        categoryName: "Notas"\n    )\n\n    @Parameter(title: "Título", description: "Título de la nota")\n    var noteTitle: String\n\n    @Parameter(title: "Contenido", description: "Contenido principal de la nota")\n    var content: String\n\n    @Parameter(title: "Etiqueta", description: "Categoría opcional")\n    var tag: String?\n\n    @MainActor\n    func perform() async throws -> some IntentResult & ProvidesDialog {\n        let store = NoteStore.shared\n        let note = Note(title: noteTitle, content: content)\n        try await store.addNote(note)\n        return .result(dialog: "Nota '\\(noteTitle)' creada correctamente.")\n    }\n}`;

  const codeSearch = `import AppIntents\n\n// MARK: - Intent para buscar notas\n\nstruct SearchNotesIntent: AppIntent {\n    static var title: LocalizedStringResource = "Buscar Notas"\n\n    @Parameter(title: "Búsqueda", requestValueDialog: "¿Qué nota buscas?")\n    var query: String\n\n    @MainActor\n    func perform() async throws -> some IntentResult & ProvidesDialog {\n        let results = await NoteStore.shared.search(query: query)\n        let dialog = results.isEmpty\n            ? "No encontré notas para '\\(query)'"\n            : "Encontré \\(results.count) nota(s) sobre '\\(query)'"\n        return .result(dialog: IntentDialog(stringLiteral: dialog))\n    }\n}\n\n// MARK: - Registro de App Shortcuts con Siri\n\nstruct NoteAssistShortcuts: AppShortcutsProvider {\n    static var appShortcuts: [AppShortcut] {\n        AppShortcut(\n            intent: CreateNoteIntent(),\n            phrases: [\n                "Crear nota en \\(.applicationName)",\n                "Nueva nota en \\(.applicationName)",\n                "Añadir nota a \\(.applicationName)"\n            ],\n            shortTitle: "Crear Nota",\n            systemImageName: "note.text.badge.plus"\n        )\n        AppShortcut(\n            intent: SearchNotesIntent(),\n            phrases: [\n                "Buscar en \\(.applicationName)",\n                "Buscar nota en \\(.applicationName)"\n            ],\n            shortTitle: "Buscar Notas",\n            systemImageName: "magnifyingglass"\n        )\n    }\n}`;

  return (
    <section className="section" id="app-intents">
      <div className="container">
        <div className="section-header">
          <span className="section-number">01</span>
          <h2 className="section-title">App Intents para integración con Siri</h2>
          <p className="section-desc">
            Expón acciones de tu app al sistema operativo para que Apple Intelligence las active
            mediante comandos de voz en lenguaje natural, sin frases rígidas.
          </p>
        </div>

        <div className="prose">
          <p>
            Los <strong>App Intents</strong> son la forma moderna de integrar tu app con Siri,
            Spotlight y los atajos del sistema. Con Apple Intelligence, el modelo de lenguaje
            de Apple puede mapear peticiones en lenguaje natural a tus intents
            <em> automáticamente</em>, lo que significa que el usuario puede decir cosas como
            "apunta que tengo reunión el viernes" y Siri sabrá invocar <code>CreateNoteIntent</code>.
          </p>
        </div>

        <div className="cards">
          <Card icon="🎯" title="AppIntent" desc="Struct que define una acción. Implementa perform() con async/await para ejecutar la lógica."/>
          <Card icon="📝" title="@Parameter" desc="Parámetros declarativos. Siri los solicita automáticamente si el usuario no los proporcionó."/>
          <Card icon="⚡" title="AppShortcutsProvider" desc="Registra frases en lenguaje natural que activan tus intents directamente."/>
          <Card icon="🔄" title="ProvidesDialog" desc="Devuelve respuesta hablada a Siri. Combina con ReturnsValue para devolver datos."/>
        </div>

        <div className="prose">
          <h3>Paso 1 — Modelo de datos Sendable</h3>
          <p>
            Con Swift 6 strict concurrency, el modelo debe conformar <code>Sendable</code>
            para cruzar fronteras de concurrencia de forma segura:
          </p>
        </div>
        <CodeBlock filename="Note.swift" code={codeModel}/>

        <div className="prose">
          <h3>Paso 2 — Definir el AppIntent</h3>
          <p>
            Cada acción es un <code>struct</code> que conforma <code>AppIntent</code>.
            Declara los parámetros con <code>@Parameter</code> — el sistema los solicitará
            al usuario si faltan:
          </p>
        </div>
        <CodeBlock filename="CreateNoteIntent.swift" code={codeCreate}/>

        <Callout type="tip" title="@MainActor en perform()">
          Marca <code>perform()</code> con <code>@MainActor</code> cuando necesites acceder a
          stores <code>@Observable</code> o modificar estado de UI. El runtime de App Intents
          gestiona el salto de hilo automáticamente y es completamente compatible con Swift 6.
        </Callout>

        <div className="prose">
          <h3>Paso 3 — Registrar frases con Siri</h3>
          <p>
            <code>AppShortcutsProvider</code> registra las frases que activan cada intent.
            Usa <code>\(.applicationName)</code> para incluir el nombre de la app dinámicamente.
            El sistema registra los shortcuts en el primer lanzamiento, sin código adicional:
          </p>
        </div>
        <CodeBlock filename="NoteAssistShortcuts.swift" code={codeSearch}/>

        <Callout type="info" title="Registro automático">
          No necesitas llamar a ningún método de registro explícito. El sistema detecta
          <code>AppShortcutsProvider</code> en el bundle y registra los shortcuts automáticamente.
          Aparecen en la app Atajos y en los resultados de Spotlight.
        </Callout>
      </div>
    </section>
  );
}

// Export component for use
window.AppContent = { Hero, Intro, AppIntentsSection };