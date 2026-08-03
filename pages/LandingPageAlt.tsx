import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '../components/ui/Icon';

export function LandingPageAlt() {
  const { t } = useTranslation();

  const features = [
    {
      title: "Espacios Curados",
      description: "Salas de juntas y oficinas privadas con estética editorial, diseñadas para potenciar tu enfoque y creatividad.",
      icon: "architecture",
      image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200"
    },
    {
      title: "Comunidad Exclusiva",
      description: "Forma parte de un ecosistema de líderes, arquitectos y emprendedores. Networking de alto nivel en cada rincón.",
      icon: "groups",
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200"
    },
    {
      title: "Gestión Inteligente",
      description: "Plataforma integrada para reservas en tiempo real, control de créditos y acceso a beneficios exclusivos para socios.",
      icon: "bolt",
      image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&q=80&w=1200"
    }
  ];

  const plans = [
    {
      name: "Básico",
      price: "$150",
      description: "Para freelancers que buscan un entorno profesional.",
      features: ["Acceso a áreas comunes", "Eventos de la comunidad", "WiFi de alta velocidad", "Café premium ilimitado"],
      cta: "Empezar ahora",
      highlighted: false
    },
    {
      name: "Plus",
      price: "$250",
      description: "Ideal para profesionales con necesidades de reuniones.",
      features: ["Todo lo del plan Básico", "10 Créditos para salas", "Networking exclusivo", "Dirección comercial"],
      cta: "Elegir Plus",
      highlighted: true
    },
    {
      name: "Premium",
      price: "$450",
      description: "La experiencia definitiva de BURÓ.",
      features: ["Todo lo del plan Plus", "Oficina dedicada", "Acceso 24/7", "Soporte administrativo"],
      cta: "Contactar Ventas",
      highlighted: false
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-[#f7db15] selection:text-black">
      {/* SEO Metadata (Mental check: Needs to be handled by Helmet or similar in real app) */}
      
      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full h-20 z-[100] px-8 md:px-16 flex items-center justify-between border-b border-slate-200 bg-white/95 backdrop-blur-3xl">
        <div className="flex items-center gap-4 group">
          <div className="size-10 bg-[#11171D] text-[#f7db15] flex items-center justify-center font-extrabold tracking-tighter rounded-xl group-hover:rotate-12 transition-all duration-700">
            B
          </div>
          <span className="text-xl font-black uppercase tracking-[-0.05em] text-[#11171D]">BURÓ <span className="font-light opacity-30">PANAMÁ</span></span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors">Características</a>
          <a href="#pricing" className="text-sm font-bold uppercase tracking-widest text-slate-500 hover:text-slate-900 transition-colors">Planes</a>
          <Link to="/login" className="text-sm font-bold uppercase tracking-widest px-6 py-2.5 bg-[#11171D] text-white rounded-lg hover:bg-slate-800 transition-all">Iniciar Sesión</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 px-8 md:px-16 overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative z-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#f7db15] bg-[#f7db15]/10 px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#CA8A04]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#f7db15]" />
              Nuevo: Workspace Arquitectónico en Panamá
            </div>
            <h1 className="mb-8 text-5xl md:text-7xl font-black uppercase tracking-[-0.05em] leading-[0.9] text-[#11171D]">
              Tu Próxima <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f7db15] to-[#CA8A04]">
                Gran Idea
              </span> <br />
              Merece un Espacio.
            </h1>
            <p className="mb-10 max-w-lg text-lg text-slate-500 leading-relaxed">
              Descubre BURÓ Panamá: El workspace donde la innovación se encuentra con el diseño editorial. Gestiona tu entorno profesional con la simplicidad de un clic.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/registro" className="px-8 py-4 bg-[#11171D] text-white rounded-xl text-xs font-bold uppercase tracking-[0.2em] hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 text-center">
                Únete a la Comunidad →
              </Link>
              <a href="#features" className="px-8 py-4 bg-white border border-slate-200 text-[#11171D] rounded-xl text-xs font-bold uppercase tracking-[0.2em] hover:bg-slate-50 transition-all text-center">
                Explorar Espacios
              </a>
            </div>
            <div className="mt-12 flex items-center gap-6 opacity-40 grayscale">
              <span className="text-[10px] font-bold uppercase tracking-widest">Confían en nosotros:</span>
              {/* Placeholder logos */}
              <div className="flex gap-4">
                <div className="h-4 w-16 bg-slate-300 rounded" />
                <div className="h-4 w-12 bg-slate-300 rounded" />
                <div className="h-4 w-20 bg-slate-300 rounded" />
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-tr from-[#f7db15]/20 to-transparent rounded-[2rem] blur-2xl" />
            <div className="relative aspect-square md:aspect-[4/5] rounded-[2rem] overflow-hidden shadow-2xl border border-white/20">
              <img 
                src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200" 
                alt="BURÓ Panamá Interior" 
                className="w-full h-full object-cover"
              />
            </div>
            {/* Floating Card */}
            <div className="absolute -bottom-10 -left-10 bg-white p-6 rounded-2xl shadow-2xl border border-slate-100 hidden md:block animate-float">
              <div className="flex items-center gap-4">
                <div className="size-12 bg-[#f7db15] rounded-lg flex items-center justify-center text-black">
                  <Icon name="workspace_premium" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Membresía Activa</p>
                  <p className="text-sm font-bold uppercase text-[#11171D]">Socio Elite Arq</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32 px-8 md:px-16 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-24 text-center max-w-3xl mx-auto">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#CA8A04] mb-4">Por qué BURÓ</p>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-[#11171D]">
              Redefiniendo el estándar del Coworking Premium.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {features.map((feature, idx) => (
              <div key={idx} className="group">
                <div className="mb-8 aspect-video rounded-2xl overflow-hidden shadow-lg">
                  <img src={feature.image} alt={feature.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="size-10 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-[#11171D]">
                    <Icon name={feature.icon} className="!text-xl" />
                  </div>
                  <h3 className="text-lg font-bold uppercase tracking-tight text-[#11171D]">{feature.title}</h3>
                </div>
                <p className="text-slate-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-8 md:px-16 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="mb-24 text-center max-w-3xl mx-auto">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-[#CA8A04] mb-4">Membresías</p>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-[#11171D]">
              Planes que se adaptan a tu ritmo de trabajo.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, idx) => (
              <div 
                key={idx} 
                className={`p-10 rounded-[2rem] flex flex-col transition-all duration-500 ${
                  plan.highlighted 
                    ? 'bg-[#11171D] text-white shadow-2xl scale-105 relative z-10' 
                    : 'bg-white text-slate-900 border border-slate-200 hover:shadow-xl'
                }`}
              >
                <div className="mb-8">
                  <h3 className={`text-xs font-bold uppercase tracking-[0.3em] mb-4 ${plan.highlighted ? 'text-[#f7db15]' : 'text-slate-400'}`}>
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-black tracking-tighter">{plan.price}</span>
                    <span className={`text-sm font-medium ${plan.highlighted ? 'text-white/40' : 'text-slate-400'}`}>/mes</span>
                  </div>
                  <p className={`mt-4 text-sm ${plan.highlighted ? 'text-white/60' : 'text-slate-500'}`}>
                    {plan.description}
                  </p>
                </div>

                <ul className="space-y-4 mb-10 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm">
                      <Icon name="check_circle" className={`material-symbols-outlined !text-sm ${plan.highlighted ? 'text-[#f7db15]' : 'text-[#CA8A04]'}`} />
                      <span className={plan.highlighted ? 'text-white/80' : 'text-slate-600'}>{f}</span>
                    </li>
                  ))}
                </ul>

                <button className={`w-full py-4 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] transition-all ${
                  plan.highlighted 
                    ? 'bg-[#f7db15] text-black hover:bg-[#CA8A04]' 
                    : 'bg-slate-100 text-[#11171D] hover:bg-slate-200'
                }`}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-8 md:px-16">
        <div className="max-w-7xl mx-auto">
          <div className="bg-[#f7db15] rounded-[3rem] p-12 md:p-24 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-black/5 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-black leading-[0.9] mb-8">
                ¿Listo para elevar <br />tu entorno de trabajo?
              </h2>
              <p className="text-black/70 text-lg font-medium leading-relaxed mb-10">
                Agenda una visita personalizada hoy mismo y descubre por qué somos el espacio preferido de la comunidad creativa en Panamá.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/registro" className="px-10 py-5 bg-black text-white rounded-2xl text-xs font-bold uppercase tracking-[0.2em] hover:bg-slate-900 transition-all text-center">
                  Comenzar ahora
                </Link>
                <button className="px-10 py-5 bg-white text-black rounded-2xl text-xs font-bold uppercase tracking-[0.2em] border border-black/10 hover:bg-slate-50 transition-all text-center">
                  Hablar con un asesor
                </button>
              </div>
            </div>
            <div className="relative z-10 hidden lg:block">
              <div className="size-64 bg-black rounded-3xl rotate-6 flex items-center justify-center p-8 shadow-2xl">
                <div className="text-center">
                  <p className="text-[#f7db15] text-5xl font-black mb-2 tracking-tighter">100%</p>
                  <p className="text-white text-[10px] font-bold uppercase tracking-widest leading-tight">Compromiso con la Excelencia</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 px-8 md:px-16 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-16">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-4 mb-8 group">
              <div className="size-10 bg-[#11171D] text-[#f7db15] flex items-center justify-center font-extrabold tracking-tighter rounded-xl group-hover:rotate-12 transition-all duration-700">
                B
              </div>
              <span className="text-xl font-black uppercase tracking-[-0.05em] text-[#11171D]">BURÓ <span className="font-light opacity-30">PANAMÁ</span></span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              El primer Workspace Arquitectónico de Coworking en Panamá. Donde el diseño se encuentra con la productividad.
            </p>
          </div>
          
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#11171D] mb-8">Navegación</h4>
            <ul className="space-y-4 text-sm text-slate-500 font-bold uppercase tracking-widest">
              <li><a href="#" className="hover:text-[#CA8A04] transition-colors">Inicio</a></li>
              <li><a href="#features" className="hover:text-[#CA8A04] transition-colors">Características</a></li>
              <li><a href="#pricing" className="hover:text-[#CA8A04] transition-colors">Planes</a></li>
              <li><Link to="/login" className="hover:text-[#CA8A04] transition-colors">Acceso Socios</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#11171D] mb-8">Contacto</h4>
            <ul className="space-y-4 text-sm text-slate-500">
              <li className="flex items-center gap-3">
                <Icon name="location_on" className="!text-sm" />
                <span>Calle 50, Ciudad de Panamá</span>
              </li>
              <li className="flex items-center gap-3">
                <Icon name="mail" className="!text-sm" />
                <span>info@buropanama.com</span>
              </li>
              <li className="flex items-center gap-3">
                <Icon name="call" className="!text-sm" />
                <span>+507 8888-8888</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#11171D] mb-8">Newsletter</h4>
            <p className="text-slate-400 text-sm mb-6">Recibe las últimas noticias del ecosistema BURÓ.</p>
            <div className="flex gap-2">
              <input type="email" placeholder="Email" className="bg-slate-100 border-none rounded-lg px-4 py-3 text-sm flex-1 focus:ring-2 focus:ring-[#f7db15] outline-none" />
              <button className="bg-[#11171D] text-white p-3 rounded-lg hover:bg-slate-800 transition-all">
                <Icon name="arrow_forward" className="!text-sm" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-24 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300">© 2024 BURÓ PANAMÁ. TODOS LOS DERECHOS RESERVADOS.</p>
          <div className="flex gap-8 text-[10px] font-bold uppercase tracking-widest text-slate-300">
            <a href="#" className="hover:text-slate-600 transition-colors">Términos</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Privacidad</a>
            <a href="#" className="hover:text-slate-600 transition-colors">Cookies</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPageAlt;
