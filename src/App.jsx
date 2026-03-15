import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Trash2, Download, MessageSquarePlus, ImagePlus, Menu, X, FileText } from 'lucide-react';
import { jsPDF } from "jspdf";
import * as htmlToImage from 'html-to-image';
import { db } from './firebase';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';

// --- STILI GLOBALI ---
const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap');

  :root {
    font-family: 'Outfit', sans-serif;
  }

  body {
    background-color: #ffffff;
    color: #475569;
    font-weight: 300;
  }

  .font-outfit { font-family: 'Outfit', sans-serif; }
  
  .figjam-bg {
    background-color: #ffffff;
    background-image: radial-gradient(#cbd5e1 0.5px, transparent 0.5px);
    background-size: 10px 10px;
  }

  .sidebar-container {
    background-color: #ffffff;
    position: relative;
  }

  .sidebar-gradient-overlay {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 100%;
    background: radial-gradient(circle at 100% 100%, rgba(244, 114, 182, 0.4) 0%, rgba(251, 146, 60, 0.25) 40%, rgba(255, 255, 255, 0) 80%);
    pointer-events: none;
    z-index: 0;
  }

  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
  ::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
  
  select {
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
  }

  @media print {
    aside, 
    .md\:hidden, 
    button, 
    .no-print {
      display: none !important;
    }
    
    main {
      overflow: visible !important;
      height: auto !important;
      position: static !important;
      padding-top: 0 !important;
    }

    #main-scroll-container {
      overflow: visible !important;
      height: auto !important;
      background: white !important;
    }

    .figjam-bg {
      background-image: none !important;
    }

    .shadow-sm, .shadow-md, .shadow-xl {
      shadow: none !important;
      border: 1px solid #e2e8f0 !important;
    }

    section {
      page-break-inside: avoid;
      margin-top: 2rem !important;
      border: none !important;
    }

    table {
      page-break-inside: auto;
    }

    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }
  }
`;

// --- DATI INIZIALI ---
const initialData = {
  title: "PRD: EVOLUZIONE DIGITALE END-TO-END FEUDI DI SAN GREGORIO",
  version: "Master Copy",
  lastUpdated: new Date().toLocaleDateString('it-IT'),
  author: "Product Team",
  // Default cover che simula il gradient dell'immagine allegata
  coverImage: "linear-gradient(90deg, #d3d5d8 0%, #c98fb4 25%, #ee757e 50%, #fa9e88 75%, #fcd0c2 100%)",
  coverPosition: 50,
  solutions: [
    {
      id: "area-1",
      title: "AREA 1: FONDAMENTA TECNOLOGICHE & SCALABILITÀ OPERATIVA",
      objective: "Eliminare il debito tecnologico e i silos informativi per rendere l'azienda autonoma, sicura, conforme e scalabile.",
      problem: "Il sito attuale (WooCommerce) è instabile e lento. Il magazzino è scollegato dall'online, forzando processi manuali (Excel/XML) che generano errori e ritardi. Manca una gestione strutturata del supporto e della conformità legale.",
      approach: "Migrazione Shopify Plus (valutare Headless) + Integration Layer custom + Compliance Tool.",
      metrics: [
        { id: "m1-1", text: "0 discrepanze inventario." },
        { id: "m1-2", text: "Speed Index < 2.5s." },
        { id: "m1-3", text: "SLA risposta supporto < 48h." }
      ],
      features: [
        { id: "f1-1", priority: "Must-Have", phase: "Set-up", text: "Middleware di Integrazione Real-Time Essenzia/Shopify: Sincronia stock, ordini e prezzi.", notes: "" },
        { id: "f1-2", priority: "Must-Have", phase: "Set-up", text: "Automazione Logistics: Generazione automatica etichette e invio del Tracciamento ordine.", notes: "" },
        { id: "f1-3", priority: "Must-Have", phase: "Set-up", text: "Cookie Banner (as is \"Cookiescript\") e conformità GDPR.", notes: "" },
        { id: "f1-4", priority: "Must-Have", phase: "Set-up", text: "Infrastruttura Customer Support: Live Chat e sezione FAQ dinamica.", notes: "" },
        { id: "f1-5", priority: "Must-Have", phase: "Set-up", text: "Identity Resolution: Migrazione account utente da varie fonti.", notes: "" },
        { id: "f1-6", priority: "Must-Have", phase: "Set-up", text: "Analitiche Avanzate: GA4, Heatmap e AB Testing.", notes: "" },
        { id: "f1-7", priority: "Should-Have", phase: "Set-up on top", text: "Interfaccia ad-hoc per Redemption automatica Gift Card.", notes: "" },
        { id: "f1-8", priority: "Should-Have", phase: "Future", text: "Sistema di Reservation Stock Omnicanale.", notes: "" }
      ],
      issuesDecisions: [
        { id: "id1-1", type: "Decisione", status: "Risolto", text: "Utilizzare Shopify Plus (valutare se Headless è necessario per la flessibilità dell'Area 2).", response: "Scelta confermata con il team IT." },
        { id: "id1-2", type: "Issue", status: "Aperto", text: "Proprietà del Codice: Superare il blocco tecnico del vecchio fornitore (AQuest) per recuperare contenuti e sorgenti dei siti istituzionali.", response: "" },
        { id: "id1-3", type: "Issue", status: "Aperto", text: "Scalabilità Essenzia: Verificare se le API dell'ERP reggono chiamate in tempo reale durante i picchi di traffico.", response: "" },
        { id: "id1-4", type: "Issue", status: "Aperto", text: "Perimetro Migrazione: Definire se migrare solo le anagrafiche attive o anche lo storico ordini WooCommerce e i file offline.", response: "" }
      ],
      constraints: [
        { id: "c1-1", status: "Aperto", text: "Disponibilità Web Services di Essenzia.", response: "" }
      ]
    },
    {
      id: "area-2",
      title: "AREA 2: BRAND AUTHORITY & ESPERIENZA SENSORIALE",
      objective: "Consolidare l'authority digitale e creare un'esperienza d'acquisto immersiva e adattiva (DNA \"Visionario\").",
      problem: "SEO frammentata; catalogo incompleto; UX statica che non guida l'utente né risponde ai search intent informativi.",
      approach: "Consolidamento domini (feudi.it Hub) + UI Adattiva + AI Discovery + GSO Ready.",
      metrics: [
        { id: "m2-1", text: "+ Domain Rating." },
        { id: "m2-2", text: "+25% Session Duration." },
        { id: "m2-3", text: "Incremento conversion rate organica." }
      ],
      features: [
        { id: "f2-1", priority: "Must-Have", phase: "Set-up", text: "Storytelling Brand & Identity: Info tecniche e narrative integrate nelle PDP.", notes: "" },
        { id: "f2-2", priority: "Must-Have", phase: "Set-up", text: "Componenti Adattivi: Banner dinamici (es. tema vino vs tema esperienza).", notes: "" },
        { id: "f2-3", priority: "Must-Have", phase: "Set-up", text: "Elementi Contestuali (Popup): Lead gen, promozioni o avvisi hospitality.", notes: "" },
        { id: "f2-4", priority: "Must-Have", phase: "Set-up on top", text: "Wizard \"Find your wine\" e AI Advisor: Scelta assistita del prodotto.", notes: "" },
        { id: "f2-5", priority: "Must-Have", phase: "Set-up", text: "Nesting Avanzato: Gestione annate e formati in un'unica PDP.", notes: "" },
        { id: "f2-6", priority: "Must-Have", phase: "Set-up", text: "Search Interna Avanzata: Multi-categoria, Autocomplete e Featured.", notes: "" },
        { id: "f2-7", priority: "Must-Have", phase: "Set-up", text: "Blog & Editorial EEAT: Moduli cross-website per acquisto da articoli.", notes: "" },
        { id: "f2-8", priority: "Must-Have", phase: "Set-up", text: "Dichiarazione di Accessibilità (Contrast, lettura).", notes: "" },
        { id: "f2-9", priority: "Should-Have", phase: "Future", text: "Infrastruttura Dati Strutturati Schema.org (GSO Ready).", notes: "" }
      ],
      issuesDecisions: [
        { id: "id2-1", type: "Decisione", status: "Risolto", text: "Consolidare tutti i brand (DUBL, Basilisco, ecc.) sotto il dominio principale feudi.it per ereditare l'authority SEO.", response: "" },
        { id: "id2-2", type: "Issue", status: "Aperto", text: "Campo alle Comete: Decidere se includerlo nell'hub o mantenerlo separato in quanto \"Tenuta Toscana\" fuori dalla narrazione Irpina.", response: "" },
        { id: "id2-3", type: "Issue", status: "Aperto", text: "AI Advisor: Definire la profondità del database di raccomandazione (solo vino o anche esperienze?).", response: "" },
        { id: "id2-4", type: "Issue", status: "Aperto", text: "Mapping Redirect: Gestire la migrazione dei domini satellite per non perdere il posizionamento attuale.", response: "" }
      ],
      constraints: [
        { id: "c2-1", status: "Aperto", text: "Produzione nuovi asset (video/foto) per l'intero catalogo 360°.", response: "" }
      ]
    },
    {
      id: "area-3",
      title: "AREA 3: PERFORMANCE COMMERCIALE E DISTRIBUZIONE INTEGRATA",
      objective: "Massimizzare il fatturato diretto, scalare il Gifting e automatizzare B2B e Hospitality.",
      problem: "CR bassa (1,6%); funnel gifting macchinoso; mancanza di preventivi automatici; booking hospitality scollegati.",
      approach: "Funnel Gifting dedicato + Portale Corporate + Checkout Global & Legal Compliance.",
      metrics: [
        { id: "m3-1", text: "Conversion Rate > 3,5%." },
        { id: "m3-2", text: "Aumento AOV Gifting." },
        { id: "m3-3", text: "Aumento % fatturato social." }
      ],
      features: [
        { id: "f3-1", priority: "Must-Have", phase: "Set-up", text: "Portale Corporate: Area riservata aziende con listini netti-IVA.", notes: "" },
        { id: "f3-2", priority: "Must-Have", phase: "Set-up", text: "Multi-address Checkout: Caricamento Bulk (Excel) per destinatari multipli.", notes: "" },
        { id: "f3-3", priority: "Must-Have", phase: "Set-up", text: "Funnel \"Fare un Regalo\": Messaggio, confezione e opzione \"nascondi prezzo\".", notes: "" },
        { id: "f3-4", priority: "Must-Have", phase: "Set-up", text: "Booking Hospitality Integrato: Real-time per Hotel (Simple Booking) e Ristorante (Superb).", notes: "" },
        { id: "f3-5", priority: "Must-Have", phase: "Set-up on top", text: "Workflow Preventivi Automatico: Form per Bomboniere e Eventi (Draft Order).", notes: "" },
        { id: "f3-6", priority: "Must-Have", phase: "Set-up", text: "Prodotto dell'Orto: Vendita linee lifestyle.", notes: "" },
        { id: "f3-7", priority: "Must-Have", phase: "Set-up", text: "Autocertificazione maggiore età e Multi-payment (PayPal, Klarna, ecc.).", notes: "" },
        { id: "f3-8", priority: "Must-Have", phase: "Set-up", text: "Tagging Instagram Shopping: Catalogo sincronizzato per vendita social.", notes: "" },
        { id: "f3-9", priority: "Must-Have", phase: "Set-up", text: "Tracciamento Ordine e Threshold Tracker.", notes: "" },
        { id: "f3-10", priority: "Must-Have", phase: "Set-up", text: "Mercati & Valute: 25 paesi EU.", notes: "" },
        { id: "f3-11", priority: "Should-Have", phase: "Future", text: "Recurring Billing Engine (Subscription Framework).", notes: "" },
        { id: "f3-12", priority: "Should-Have", phase: "Set-up on top", text: "Preorder e Backorder.", notes: "" },
        { id: "f3-13", priority: "Could-Have", phase: "Future", text: "Pickup Network (Enoteche/Locker).", notes: "" }
      ],
      issuesDecisions: [
        { id: "id3-1", type: "Issue", status: "Aperto", text: "Conflitto Prezzi GDO: Gestire i prezzi di marketplace terzi. Valutare l'esclusione di referenze specifiche dallo store online.", response: "" },
        { id: "id3-2", type: "Issue", status: "Aperto", text: "Spedizioni Extra-EU: Decidere se automatizzare US/UK/CH o mantenere il workflow manuale mail.", response: "" },
        { id: "id3-3", type: "Issue", status: "Aperto", text: "Nesting Varianti: Definire le regole di sorting (annata vs litraggio) e il selettore grafico.", response: "" },
        { id: "id3-4", type: "Decisione", status: "Risolto", text: "Sconto quantità confermato per le bottiglie singole.", response: "" }
      ],
      constraints: [
        { id: "c3-1", status: "Aperto", text: "Apertura API Simple Booking e Superb; listini B2B definiti.", response: "" }
      ]
    },
    {
      id: "area-4",
      title: "AREA 4: CUSTOMER INTELLIGENCE E LOYALTY ATTIVA",
      objective: "Trasformare l'utente occasionale in membro fidelizzato, unificando il profilo tra Borgo e Online.",
      problem: "84% clienti one-shot; dati fisici e digitali separati; area personale che non incentiva il ritorno.",
      approach: "Single Customer View + Segmentazione RFM + Loyalty Tiered.",
      metrics: [
        { id: "m4-1", text: "+10% Repeat Purchase Rate." },
        { id: "m4-2", text: "Aumento LTV." }
      ],
      features: [
        { id: "f4-1", priority: "Must-Have", phase: "Set-up", text: "Area Profilo Personale Completa: Anagrafica, password, indirizzi, pagamenti, ordini, credito, cancellazione.", notes: "" },
        { id: "f4-2", priority: "Must-Have", phase: "Set-up", text: "Raccolta Preferenze: Marketing + Interessi (arte, cucina, design, ecc.).", notes: "" },
        { id: "f4-3", priority: "Must-Have", phase: "Set-up on top", text: "Gestione Subscription (lato utente): Storico, vantaggi e Pausa/Cancella.", notes: "" },
        { id: "f4-4", priority: "Must-Have", phase: "Set-up", text: "Identity Resolution & Persistent ID.", notes: "" },
        { id: "f4-5", priority: "Must-Have", phase: "Set-up", text: "Social Register/Login e Newsletter Subscription.", notes: "" },
        { id: "f4-6", priority: "Must-Have", phase: "Set-up on top", text: "Tiered Loyalty Program: Punti online/offline e visualizzazione livello.", notes: "" },
        { id: "f4-7", priority: "Must-Have", phase: "Set-up", text: "Single Customer View Online/Offline: Dati Ristorante/Enoteca nel CRM via Essenzia.", notes: "" },
        { id: "f4-8", priority: "Must-Have", phase: "Set-up", text: "Social Inception & Reviews certificate.", notes: "" },
        { id: "f4-9", priority: "Must-Have", phase: "Set-up on top", text: "Personalizzazione (QR Code Bridge): QR fisico -> Promo/Punti Wallet.", notes: "" },
        { id: "f4-10", priority: "Should-Have", phase: "Future", text: "Automazione Flussi RFM.", notes: "" },
        { id: "f4-11", priority: "Should-Have", phase: "Set-up on top", text: "Wishlist e Comparatore prodotti.", notes: "" }
      ],
      issuesDecisions: [
        { id: "id4-1", type: "Issue", status: "Aperto", text: "Dati Ristorante: Trovare una soluzione tecnica per catturare i dati di chi fa scontrino nominale tramite Superb.", response: "" },
        { id: "id4-2", type: "Issue", status: "Aperto", text: "Soglie Tier: Calibrare i livelli per riflettere il DNA visionario evitando logiche puramente basate sullo sconto.", response: "" },
        { id: "id4-3", type: "Issue", status: "Aperto", text: "Legalità Contest: Verificare i vincoli legali per l'organizzazione di concorsi/contest online.", response: "" },
        { id: "id4-4", type: "Issue", status: "Aperto", text: "Integrazione Gifting/Loyalty: Definire se i punti extra per il regalo vengono assegnati a chi compra o a chi riceve.", response: "" }
      ],
      constraints: [
        { id: "c4-1", status: "Aperto", text: "Privacy Policy Omnichannel (consensi unificati); Connessione CRM/Loyalty.", response: "" }
      ]
    }
  ]
};

// --- COMPONENTI UI ---

const SeamlessInput = ({ value, onChange, placeholder, multiline, className = "", textClassName = "" }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef(null);

  // Sync external changes when not editing
  useEffect(() => {
    if (!isEditing) {
      setLocalValue(value);
    }
  }, [value, isEditing]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (multiline) {
        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = inputRef.current.scrollHeight + 'px';
      }
    }
  }, [isEditing, multiline]);

  const handleInput = (e) => {
    setLocalValue(e.target.value);
    if (multiline) {
      e.target.style.height = 'auto';
      e.target.style.height = e.target.scrollHeight + 'px';
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !multiline) {
      handleBlur();
    }
  };

  if (isEditing) {
    const commonProps = {
      ref: inputRef,
      value: localValue,
      onChange: handleInput,
      onBlur: handleBlur,
      onKeyDown: handleKeyDown,
      placeholder: placeholder,
      className: `w-full bg-white outline-none ring-1 ring-slate-300 rounded p-1 -m-1 resize-none overflow-hidden transition-all text-slate-700 ${textClassName}`
    };

    return multiline ? (
      <textarea {...commonProps} rows={1} />
    ) : (
      <input type="text" {...commonProps} />
    );
  }

  return (
    <div 
      className={`cursor-text rounded hover:bg-slate-50 p-1 -m-1 transition-all border border-transparent hover:border-slate-200 border-dashed ${className}`}
      onClick={() => setIsEditing(true)}
      title="Clicca per modificare"
    >
      <span className={`${!value ? 'text-slate-300 italic font-light' : ''} ${textClassName}`}>
        {value || placeholder}
      </span>
    </div>
  );
};

// Selectors (Dropdowns)
const SelectDropdown = ({ value, onChange, options, colorMap }) => {
  return (
    <div className="relative inline-block w-full min-w-[120px]">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full text-[11px] uppercase tracking-wide font-medium px-2 py-1.5 rounded border outline-none cursor-pointer transition-colors appearance-none text-center ${colorMap[value] || "bg-slate-50 text-slate-600 border-slate-200"}`}
      >
        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
      </select>
    </div>
  );
};

const PrioritySelect = ({ value, onChange }) => {
  const map = {
    "Must-Have": "bg-rose-50 text-rose-700 border-rose-200",
    "Should-Have": "bg-amber-50 text-amber-700 border-amber-200",
    "Could-Have": "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  return <SelectDropdown value={value} onChange={onChange} options={Object.keys(map)} colorMap={map} />;
};

const PhaseSelect = ({ value, onChange }) => {
  const map = {
    "Set-up": "bg-blue-50 text-blue-700 border-blue-200",
    "Set-up on top": "bg-purple-50 text-purple-700 border-purple-200",
    "Future": "bg-slate-100 text-slate-600 border-slate-200",
  };
  return <SelectDropdown value={value} onChange={onChange} options={Object.keys(map)} colorMap={map} />;
};

const TypeSelect = ({ value, onChange }) => {
  const map = {
    "Issue": "bg-orange-50 text-orange-700 border-orange-200",
    "Decisione": "bg-teal-50 text-teal-700 border-teal-200",
    "Vincolo": "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
  };
  return <SelectDropdown value={value} onChange={onChange} options={["Issue", "Decisione", "Vincolo"]} colorMap={map} />;
};

const StatusSelect = ({ value, onChange }) => {
  const map = {
    "Aperto": "bg-white text-rose-500 border-rose-200 border-dashed",
    "Risolto": "bg-green-50 text-green-700 border-green-200",
  };
  return <SelectDropdown value={value} onChange={onChange} options={Object.keys(map)} colorMap={map} />;
};

// --- COMPONENTE PRINCIPALE ---
export default function App() {
  const [prd, setPrdState] = useState(initialData);
  const [activeNotes, setActiveNotes] = useState({});
  const [activeSolId, setActiveSolId] = useState(initialData.solutions[0].id);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [saveError, setSaveError] = useState(false);
  
  const fileInputRef = useRef(null);

  // Drag & Drop Refs 
  const dragItem = useRef({ solId: null, arrayName: null, index: null });
  const dragOverItem = useRef({ solId: null, arrayName: null, index: null });

  // Firebase integration - stabilize ref so listener doesn't restart on every render
  const prdDocRef = useRef(doc(db, 'projects', 'prd-main')).current;

  useEffect(() => {
    const unsubscribe = onSnapshot(prdDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data && Object.keys(data).length > 0) {
            setPrdState(data);
        }
      } else {
        // Initialize with default data if empty
        setDoc(prdDocRef, initialData);
        setPrdState(initialData);
      }
      setIsInitialized(true);
    });

    return () => unsubscribe();
  }, [prdDocRef]);

  // Unified save function
  const savePrd = useCallback((newData) => {
      const dataWithDate = { ...newData, lastUpdated: new Date().toLocaleDateString('it-IT') };
      setPrdState(dataWithDate); // Optimistic UI update
      setDoc(prdDocRef, dataWithDate).catch(error => {
          console.error("Error saving document: ", error);
          setSaveError(true);
          setTimeout(() => setSaveError(false), 4000);
      });
  }, [prdDocRef]);

  // Update active sidebar tab on scroll
  useEffect(() => {
    const handleScroll = () => {
      let currentActiveId = prd.solutions[0].id;
      for (const sol of prd.solutions) {
        const element = document.getElementById(sol.id);
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top <= 150) {
            currentActiveId = sol.id;
          }
        }
      }
      setActiveSolId(currentActiveId);
    };

    const mainContainer = document.getElementById('main-scroll-container');
    if (mainContainer) {
      mainContainer.addEventListener('scroll', handleScroll);
      return () => mainContainer.removeEventListener('scroll', handleScroll);
    }
  }, [prd.solutions]);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setIsSidebarOpen(false); // Close sidebar on mobile after clicking
  };

  // --- AZIONI DATI ---
  const updateMainField = (field, value) => {
    const newPrd = { ...prd, [field]: value };
    savePrd(newPrd);
  };
  
  const updateSolField = (id, field, value) => {
    const newPrd = { ...prd, solutions: prd.solutions.map(s => s.id === id ? { ...s, [field]: value } : s) };
    savePrd(newPrd);
  };
  
  const updateArray = (solId, arrayName, itemId, field, value) => {
    const newPrd = { ...prd, solutions: prd.solutions.map(sol => sol.id === solId ? { ...sol, [arrayName]: sol[arrayName].map(item => item.id === itemId ? { ...item, [field]: value } : item) } : sol) };
    savePrd(newPrd);
  };

  const deleteArrayItem = (solId, arrayName, itemId) => {
    const newPrd = { ...prd, solutions: prd.solutions.map(sol => sol.id === solId ? { ...sol, [arrayName]: sol[arrayName].filter(item => item.id !== itemId) } : sol) };
    savePrd(newPrd);
  };

  const addArrayItem = (solId, arrayName, template) => {
    const newPrd = { ...prd, solutions: prd.solutions.map(sol => sol.id === solId ? { ...sol, [arrayName]: [...sol[arrayName], { id: `new-${Date.now()}`, ...template }] } : sol) };
    savePrd(newPrd);
  };

  // --- UPLOAD IMMAGINE ---
  const handleCoverUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateMainField('coverImage', `url(${reader.result})`);
      };
      reader.readAsDataURL(file);
    }
  };

  // --- DRAG & DROP MULTI-AREA ---
  const handleDragStart = (e, solId, arrayName, index) => {
    dragItem.current = { solId, arrayName, index };
  };

  const handleDragEnter = (e, solId, arrayName, index) => {
    dragOverItem.current = { solId, arrayName, index };
  };

  const handleDrop = (e) => {
    const source = dragItem.current;
    const target = dragOverItem.current;

    if (!source.solId || !target.solId || source.arrayName !== target.arrayName) return;

    setPrdState(prev => {
      const newSolutions = JSON.parse(JSON.stringify(prev.solutions));
      const sourceSol = newSolutions.find(s => s.id === source.solId);
      const targetSol = newSolutions.find(s => s.id === target.solId);
      
      const itemToMove = sourceSol[source.arrayName][source.index];
      
      sourceSol[source.arrayName].splice(source.index, 1);
      targetSol[target.arrayName].splice(target.index, 0, itemToMove);

      const newPrd = { ...prev, solutions: newSolutions };
      setTimeout(() => savePrd(newPrd), 0);
      return newPrd;
    });

    dragItem.current = { solId: null, arrayName: null, index: null };
    dragOverItem.current = { solId: null, arrayName: null, index: null };
  };

  const exportPDF = async () => {
    console.log("PDF Export requested...");
    const element = document.getElementById('main-scroll-container');
    if (!element) {
        console.error("Main container not found");
        return;
    }
    if (isExporting) {
        console.warn("Export already in progress...");
        return;
    }
    
    setIsExporting(true);
    console.log("Starting PDF generation...");

    try {
      const dataUrl = await htmlToImage.toPng(element, {
        cacheBust: true,
        backgroundColor: '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
        style: {
          overflow: 'visible',
          height: 'auto'
        }
      });
      
      console.log("Canvas captured, creating PDF...");
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      
      console.log("PDF ready, saving...");
      pdf.save(`PRD_Feudi_San_Gregorio_${new Date().toLocaleDateString('it-IT').replace(/\//g, '-')}.pdf`);
    } catch (error) {
      console.error("Errore esportazione PDF:", error);
      alert("Si è verificato un errore durante la generazione del PDF. Riprova.");
    } finally {
      setIsExporting(false);
      console.log("Export process finished.");
    }
  };

  const exportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(prd, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `PRD_Feudi.json`;
    a.click();
  };

  if (!isInitialized) {
      return <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500">Connessione in corso...</div>;
  }

  return (
    <>
      <style>{globalStyles}</style>
      <div className="flex h-screen font-outfit overflow-hidden relative">
        
        {/* Mobile Header overlay */}
        <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white/80 backdrop-blur border-b border-slate-200 z-50 flex items-center px-4 justify-between">
            <span className="font-semibold text-slate-800 text-sm">PRD Feudi</span>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg">
                {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
        </div>

        {/* SIDEBAR */}
        <aside 
          className={`fixed md:relative h-full ${isSidebarOpen ? 'left-0' : '-left-full'} md:left-0 z-40 transition-all duration-300 ease-in-out sidebar-container border-r border-slate-200 flex flex-col flex-shrink-0 shadow-xl md:shadow-sm top-0 pt-14 md:pt-0`}
          style={{ width: '320px', minWidth: '320px' }}
        >
          <div className="sidebar-gradient-overlay"></div>
          
          <div className="p-6 pb-4 relative z-10 hidden md:block">
            <h1 className="text-xl tracking-wide text-slate-800 uppercase">PRD</h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Feudi di San Gregorio</p>
          </div>
          
          <div className="p-4 overflow-y-auto flex-1 space-y-4 relative z-10">
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-widest mb-3 px-2">Aree di Prodotto</div>
              <div className="space-y-1">
                {prd.solutions.map((sol, index) => (
                  <button
                    key={sol.id}
                    onClick={() => scrollToSection(sol.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all flex items-center gap-2 ${
                      activeSolId === sol.id ? 'bg-white shadow text-slate-900 border border-slate-200' : 'text-slate-600 hover:bg-slate-50/50 border border-transparent'
                    }`}
                  >
                    <span className="w-4 text-slate-400 font-light text-xs shrink-0">{index + 1}.</span>
                    <span className="whitespace-normal leading-tight text-left break-words line-clamp-2 overflow-hidden h-auto py-0.5">{sol.title.replace(/AREA \d+:\s*/, '')}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-5 mt-auto relative z-20 border-t border-slate-100 flex flex-col gap-2">
             <button 
              onClick={exportPDF} 
              disabled={isExporting}
              className={`w-full flex items-center justify-center gap-2 text-xs uppercase tracking-wide text-white rounded-lg py-2.5 transition-all shadow-md ${isExporting ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-900'}`}
            >
              <FileText size={14} /> {isExporting ? 'Generazione...' : 'Esporta PDF'}
            </button>
             <button onClick={exportJSON} className="w-full text-center text-[10px] uppercase tracking-wide text-slate-400 hover:text-slate-600 transition-all">
              Scarica Backup JSON
            </button>
          </div>
        </aside>

        {/* Mobile backdrop */}
        {isSidebarOpen && (
            <div className="fixed inset-0 bg-slate-900/20 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)} />
        )}

        {/* MAIN CONTENT AREA - SCROLL CONTINUO */}
        <main id="main-scroll-container" className="flex-1 overflow-y-auto figjam-bg relative scroll-smooth pt-14 md:pt-0">
          
          {/* Save error toast */}
          {saveError && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-rose-600 text-white text-sm px-5 py-2.5 rounded-xl shadow-lg animate-pulse">
              ⚠️ Errore nel salvataggio — controlla la connessione
            </div>
          )}

          {/* NOTION-LIKE COVER */}
          <div 
            className="w-full h-40 md:h-72 relative group transition-all"
            style={{
              background: prd.coverImage,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            {/* Tasto per cambiare cover che appare al passaggio del mouse */}
            <div className="absolute bottom-4 right-4 md:right-8 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 bg-white/80 hover:bg-white text-slate-700 px-3 py-1.5 rounded-md text-xs font-semibold shadow-sm backdrop-blur-sm transition-all"
              >
                <ImagePlus size={14} /> Cambia Cover
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleCoverUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>
          </div>

          <div className="w-full max-w-[1000px] mx-auto px-4 md:px-8 pb-32 space-y-16 md:space-y-24 relative z-10 pt-6 md:pt-10">
            
            {/* DOCUMENT TITLE & HEADER */}
            <div className="mb-4 border-b border-slate-200 pb-8 text-left">
               <h1 className="mb-4">
                 <SeamlessInput 
                   value={prd.title} 
                   onChange={v => updateMainField('title', v)} 
                   multiline
                   textClassName="text-2xl md:text-4xl font-bold uppercase tracking-wide text-slate-900 leading-tight" 
                 />
               </h1>
               <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] md:text-[13px] text-slate-500 font-medium">
                 <span className="bg-white px-2.5 py-1 rounded-md border border-slate-200 text-slate-600 shadow-sm">{prd.version}</span>
                 <span>Aggiornato il {prd.lastUpdated}</span>
                 <span className="hidden md:inline w-1 h-1 rounded-full bg-slate-300 mx-1"></span>
                 <span>Autore: {prd.author}</span>
               </div>
            </div>

            {/* SEZIONI AREE (Scrolling) */}
            {prd.solutions.map((area) => (
              <section key={area.id} id={area.id} className="scroll-mt-16 md:scroll-mt-12 bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                
                <header className="mb-8 md:mb-10">
                  <h2 className="text-lg md:text-xl font-bold uppercase tracking-wide text-slate-900 mb-4 md:mb-6 leading-tight">
                    <SeamlessInput value={area.title} onChange={(v) => updateSolField(area.id, 'title', v)} multiline />
                  </h2>
                  <div className="flex flex-col md:flex-row gap-2 md:gap-4 md:items-start bg-slate-50/50 md:bg-transparent p-4 md:p-0 rounded-xl">
                    <span className="text-[10px] md:text-[11px] text-slate-400 uppercase tracking-widest md:mt-1.5 shrink-0 font-medium">OBIETTIVO GENERALE:</span>
                    <SeamlessInput 
                      value={area.objective} 
                      onChange={v => updateSolField(area.id, 'objective', v)} 
                      multiline 
                      textClassName="text-[14px] md:text-[15px] text-slate-600 leading-relaxed font-medium block w-full"
                    />
                  </div>
                </header>

                <div className="flex flex-col gap-4 md:gap-6 mb-8 md:mb-10">
                  <div className="bg-slate-50/50 p-4 md:p-6 rounded-xl border border-slate-100 shadow-sm">
                    <h3 className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mb-2 md:mb-3">PROBLEM ALIGNMENT</h3>
                    <SeamlessInput 
                      value={area.problem} 
                      onChange={v => updateSolField(area.id, 'problem', v)} 
                      multiline 
                      textClassName="text-[14px] md:text-[16px] text-slate-700 leading-relaxed font-normal block w-full"
                    />
                  </div>
                  <div className="bg-slate-50/50 p-4 md:p-6 rounded-xl border border-slate-100 shadow-sm">
                    <h3 className="text-[10px] font-medium text-slate-500 uppercase tracking-widest mb-2 md:mb-3">APPROACH (SOLUZIONI PER AREA)</h3>
                    <SeamlessInput 
                      value={area.approach} 
                      onChange={v => updateSolField(area.id, 'approach', v)} 
                      multiline 
                      textClassName="text-[14px] md:text-[16px] text-slate-700 leading-relaxed font-normal block w-full"
                    />
                  </div>
                </div>

                {/* SUCCESS METRICS */}
                <div className="mb-8 md:mb-12 bg-indigo-50/30 p-4 md:p-5 rounded-xl border border-indigo-100/50">
                  <div className="flex justify-between items-end mb-3">
                    <h3 className="text-[10px] text-indigo-500 uppercase tracking-widest">SUCCESS METRICS</h3>
                    <button onClick={() => addArrayItem(area.id, 'metrics', { text: "" })} className="text-[11px] text-indigo-400 hover:text-indigo-600 uppercase tracking-wide">
                      + Aggiungi
                    </button>
                  </div>
                  <ul className="space-y-2">
                    {area.metrics.map(metric => (
                      <li key={metric.id} className="flex items-start gap-2 group">
                        <span className="text-indigo-300 mt-1 text-xs">●</span>
                        <div className="flex-1">
                          <SeamlessInput value={metric.text} onChange={v => updateArray(area.id, 'metrics', metric.id, 'text', v)} textClassName="text-[13px] md:text-[14px] text-slate-700 block w-full" multiline />
                        </div>
                        <button onClick={() => deleteArrayItem(area.id, 'metrics', metric.id)} className="md:opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 p-1">
                          <Trash2 size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* SOLUTION ALIGNMENT (KEY FEATURES) */}
                <div className="mb-12">
                  <div className="flex justify-between items-end mb-4 border-b border-slate-100 pb-2">
                    <h3 className="text-[10px] md:text-xs text-slate-500 uppercase tracking-widest">SOLUTION ALIGNMENT (FEATURES)</h3>
                    <button onClick={() => addArrayItem(area.id, 'features', { priority: "Could-Have", phase: "Set-up", text: "", notes: "" })} className="text-[10px] md:text-[11px] text-slate-400 hover:text-slate-600 uppercase tracking-wide shrink-0">
                      + Aggiungi
                    </button>
                  </div>
                  
                  {/* Contenitore con overflow-x-auto per abilitare lo scroll orizzontale su mobile */}
                  <div className="overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <tbody className="divide-y divide-slate-100 text-[13px]">
                        {area.features.map((feature, index) => (
                          <tr 
                            key={feature.id} 
                            draggable
                            onDragStart={(e) => handleDragStart(e, area.id, 'features', index)}
                            onDragEnter={(e) => handleDragEnter(e, area.id, 'features', index)}
                            onDragEnd={handleDrop}
                            onDragOver={(e) => e.preventDefault()}
                            className="group hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="py-3 px-1 md:px-2 align-top text-center cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 w-6">
                              <span className="text-xs">::</span>
                            </td>
                            <td className="py-3 px-2 md:px-3 align-top w-[140px]">
                              <PrioritySelect value={feature.priority} onChange={v => updateArray(area.id, 'features', feature.id, 'priority', v)} />
                            </td>
                            <td className="py-3 px-2 md:px-3 align-top text-slate-700 font-light relative group/note">
                              <div className="min-w-[200px]">
                                <SeamlessInput value={feature.text} onChange={v => updateArray(area.id, 'features', feature.id, 'text', v)} multiline />
                              </div>
                              
                              {(feature.notes || activeNotes[feature.id]) ? (
                                  <div className="mt-2 mb-1">
                                    <SeamlessInput 
                                      value={feature.notes} 
                                      onChange={v => updateArray(area.id, 'features', feature.id, 'notes', v)} 
                                      multiline 
                                      placeholder="Nota..." 
                                      textClassName="text-[12px] text-slate-400 italic bg-slate-50 p-1.5 rounded" 
                                    />
                                  </div>
                                ) : (
                                  <button 
                                    onClick={() => setActiveNotes(prev => ({...prev, [feature.id]: true}))}
                                    className="absolute -left-2 md:-left-5 top-4 md:opacity-0 group-hover/note:opacity-100 text-slate-300 hover:text-slate-500 transition-opacity"
                                    title="Aggiungi Nota"
                                  >
                                    <MessageSquarePlus size={12} />
                                  </button>
                                )}
                            </td>
                            <td className="py-3 px-2 md:px-3 align-top w-[150px]">
                              <PhaseSelect value={feature.phase || "Set-up"} onChange={v => updateArray(area.id, 'features', feature.id, 'phase', v)} />
                            </td>
                            <td className="py-3 px-1 md:px-2 align-top text-center w-8">
                              <button onClick={() => deleteArrayItem(area.id, 'features', feature.id)} className="md:opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-400 p-1">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                        {area.features.length === 0 && (
                          <tr 
                            onDragEnter={(e) => handleDragEnter(e, area.id, 'features', 0)}
                            onDragEnd={handleDrop}
                            onDragOver={(e) => e.preventDefault()}
                          >
                             <td colSpan="5" className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
                               Nessuna feature. Trascina qui o aggiungi.
                             </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* OPEN ISSUES & DECISIONS */}
                <div className="mb-12">
                   <div className="flex justify-between items-end mb-4 border-b border-slate-100 pb-2">
                    <h3 className="text-[10px] md:text-xs text-slate-500 uppercase tracking-widest">OPEN ISSUES & KEY DECISIONS</h3>
                    <button onClick={() => addArrayItem(area.id, 'issuesDecisions', { type: "Issue", status: "Aperto", text: "", response: "" })} className="text-[10px] md:text-[11px] text-slate-400 hover:text-slate-600 uppercase tracking-wide shrink-0">
                      + Aggiungi
                    </button>
                  </div>
                  
                  <div className="overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <tbody className="divide-y divide-slate-100 text-[13px]">
                        {area.issuesDecisions.map((item, index) => (
                          <tr 
                            key={item.id} 
                            draggable
                            onDragStart={(e) => handleDragStart(e, area.id, 'issuesDecisions', index)}
                            onDragEnter={(e) => handleDragEnter(e, area.id, 'issuesDecisions', index)}
                            onDragEnd={handleDrop}
                            onDragOver={(e) => e.preventDefault()}
                            className="group hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="py-3 px-1 md:px-2 align-top text-center cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 w-6">
                              <span className="text-xs">::</span>
                            </td>
                            <td className="py-3 px-2 md:px-3 align-top w-[140px]">
                               <TypeSelect value={item.type} onChange={v => updateArray(area.id, 'issuesDecisions', item.id, 'type', v)} />
                            </td>
                            <td className="py-3 px-2 md:px-3 align-top text-slate-700 font-light min-w-[200px]">
                              <div className="mb-1">
                                <SeamlessInput value={item.text} onChange={v => updateArray(area.id, 'issuesDecisions', item.id, 'text', v)} multiline />
                              </div>
                              <div>
                                <SeamlessInput 
                                  value={item.response} 
                                  onChange={v => updateArray(area.id, 'issuesDecisions', item.id, 'response', v)} 
                                  multiline 
                                  placeholder="Risposta/Soluzione..." 
                                  textClassName={`text-[12px] bg-slate-50 p-1.5 rounded block ${item.status === 'Risolto' ? 'text-green-700' : 'text-slate-400'}`} 
                                />
                              </div>
                            </td>
                            <td className="py-3 px-2 md:px-3 align-top w-[140px]">
                               <StatusSelect value={item.status || "Aperto"} onChange={v => updateArray(area.id, 'issuesDecisions', item.id, 'status', v)} />
                            </td>
                            <td className="py-3 px-1 md:px-2 align-top text-center w-8">
                              <button onClick={() => deleteArrayItem(area.id, 'issuesDecisions', item.id)} className="md:opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-400 p-1">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* VINCOLI */}
                <div>
                   <div className="flex justify-between items-end mb-4 border-b border-slate-100 pb-2">
                    <h3 className="text-[10px] md:text-xs text-slate-500 uppercase tracking-widest">VINCOLI & DIPENDENZE</h3>
                    <button onClick={() => addArrayItem(area.id, 'constraints', { status: "Aperto", text: "", response: "" })} className="text-[10px] md:text-[11px] text-slate-400 hover:text-slate-600 uppercase tracking-wide shrink-0">
                      + Aggiungi
                    </button>
                  </div>
                  <div className="overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
                    <table className="w-full text-left border-collapse min-w-[700px]">
                      <tbody className="divide-y divide-slate-100 text-[13px]">
                        {area.constraints.map((item, index) => (
                          <tr 
                            key={item.id} 
                            draggable
                            onDragStart={(e) => handleDragStart(e, area.id, 'constraints', index)}
                            onDragEnter={(e) => handleDragEnter(e, area.id, 'constraints', index)}
                            onDragEnd={handleDrop}
                            onDragOver={(e) => e.preventDefault()}
                            className="group hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="py-3 px-1 md:px-2 align-top text-center cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 w-6">
                              <span className="text-xs">::</span>
                            </td>
                            <td className="py-3 px-2 md:px-3 align-top text-slate-700 font-light min-w-[200px]">
                              <div className="mb-1">
                                <SeamlessInput value={item.text} onChange={v => updateArray(area.id, 'constraints', item.id, 'text', v)} multiline />
                              </div>
                              <div>
                                <SeamlessInput value={item.response} onChange={v => updateArray(area.id, 'constraints', item.id, 'response', v)} multiline placeholder="Note mitigazione..." textClassName="text-[12px] bg-slate-50 p-1.5 rounded text-slate-400 block" />
                              </div>
                            </td>
                            <td className="py-3 px-2 md:px-3 align-top w-[140px]">
                               <StatusSelect value={item.status || "Aperto"} onChange={v => updateArray(area.id, 'constraints', item.id, 'status', v)} />
                            </td>
                            <td className="py-3 px-1 md:px-2 align-top text-center w-8">
                              <button onClick={() => deleteArrayItem(area.id, 'constraints', item.id)} className="md:opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-400 p-1">
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </section>
            ))}

          </div>
        </main>
      </div>
    </>
  );
}
