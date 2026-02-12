import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

// Floating code characters data
const floatingCodeChars = [
  { char: '{', style: { top: '15%', left: '10%', fontSize: '2rem' } },
  { char: '}', style: { top: '25%', right: '15%', fontSize: '2.5rem' } },
  { char: '< />', style: { top: '40%', left: '20%', fontSize: '1.5rem' } },
  { char: ';', style: { top: '60%', right: '10%', fontSize: '1.8rem' } },
  { char: '( )', style: { top: '70%', left: '15%', fontSize: '2.2rem' } },
  { char: '[ ]', style: { top: '20%', left: '75%', fontSize: '1.6rem' } },
  { char: '#', style: { top: '80%', right: '20%', fontSize: '1.9rem' } },
  { char: '//', style: { top: '45%', right: '25%', fontSize: '1.4rem' } },
  { char: '/* */', style: { top: '30%', left: '60%', fontSize: '1.7rem' } },
  { char: '=>', style: { top: '65%', left: '70%', fontSize: '2.1rem' } },
];

export default function DocsPage() {
  const { t, dir } = useI18n();
  const { user, profile, userRole, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Only redirect from the root route "/", not from "/docs"
  useEffect(() => {
    if (isLoading) return;
    if (location.pathname !== '/') return;

    // Check for Supabase error hash params (e.g., expired confirmation link)
    const hash = window.location.hash;
    if (hash.includes('error=')) {
      navigate('/not-found', { replace: true });
      return;
    }

    if (user && profile) {
      if (userRole === 'admin' || userRole === 'algorithm_editor') {
        navigate('/admin', { replace: true });
      } else if (profile.onboarding_stage === 'profile' || !profile.username) {
        navigate('/setup', { replace: true });
      } else if (profile.onboarding_stage === 'iq') {
        navigate('/iq', { replace: true });
      } else if (profile.onboarding_stage === 'ready') {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, profile, userRole, isLoading, navigate, location.pathname]);

  // Scroll animation effect
  useEffect(() => {
    const handleScroll = () => {
      const elements = document.querySelectorAll('.animate-on-scroll');
      elements.forEach((element) => {
        const elementTop = element.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        if (elementTop < windowHeight - 100) {
          element.classList.add('animated');
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Trigger once on load
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Main Hero Logo Icon
  const MainHeroLogoIcon = () => (
    <svg 
      className="logo-icon animate-spin-slow" 
      width="64" 
      height="64" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor"
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );

  // Card SVG Icon Components
  const WebDevIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="16 18 22 12 16 6"></polyline>
      <polyline points="8 6 2 12 8 18"></polyline>
    </svg>
  );

  const MobileDevIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
      <line x1="12" y1="18" x2="12.01" y2="18"></line>
    </svg>
  );

  const AIIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
      <line x1="12" y1="22.08" x2="12" y2="12"></line>
    </svg>
  );

  const AllFieldsIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="2" y1="12" x2="22" y2="12"></line>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
    </svg>
  );

  return (
    <div className="min-h-screen bg-background text-foreground" dir={dir}>

      {/* Main Hero Section (from index.html) */}
      <section id="hero" className="relative min-h-[90vh] flex items-center justify-center overflow-hidden mt-16">
        {/* Background */}
        <div className="hero-background"></div>

        {/* Floating code elements */}
        <div className="absolute inset-0 pointer-events-none">
          {floatingCodeChars.map((item, index) => (
            <div
              key={index}
              className={cn(
                "code-tag",
                index % 2 === 0 ? "animate-float-slow" : "animate-float-fast"
              )}
              style={{
                ...item.style,
                animationDelay: `${index * -1}s`
              }}
            >
              {item.char}
            </div>
          ))}
        </div>

        <div className="container relative z-10 px-4 mx-auto text-center">
          <div className="flex justify-center mb-6">
            <MainHeroLogoIcon />
          </div>
          <h1 className="hero-title animate-fade-up text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
            {t('hero_title') || 'دليل - البرمجة التنافسية'}
          </h1>
          <h2 className="hero-subtitle text-xl md:text-2xl lg:text-3xl text-muted-foreground mb-8 animate-fade-up animate-delay-1">
            {t('hero_subtitle') || 'تعلّم - نافس - تطوّر'}
          </h2>
          <Button asChild size="lg" className="gap-2 px-8 py-6 text-lg animate-fade-up animate-delay-3">
            <Link to={'/roadmap'}>
              {t('cta_learn') || 'تعرف على البرمجة والبرمجة التنافسية'}
              {dir === 'rtl' ? <ArrowLeft className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
            </Link>
          </Button>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-primary rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Why Section (from docs.html hero) */}
      <section id="why" className="relative py-20 bg-muted/30">
        {/* Background */}
        <div className="hero-background" />
        
        {/* Floating Code Elements */}
        <div className="absolute inset-0 pointer-events-none">
          {floatingCodeChars.map((item, index) => (
            <div
              key={index}
              className={cn(
                "code-tag",
                index % 2 === 0 ? "animate-float-slow" : "animate-float-fast"
              )}
              style={{
                ...item.style,
                animationDelay: `${index * -1.5}s`
              }}
            >
              {item.char}
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="container relative z-10 px-4 mx-auto pt-8">
          <h1 className="doc-hero-title text-3xl md:text-4xl lg:text-5xl font-bold mb-8 text-center animate-fade-up">
            {t('doc_hero_title') || 'البرمجة: لغة العصر اللي بتحرك كل إشي'}
          </h1>
          
          <h2 className="hero-subtitle text-lg md:text-xl text-muted-foreground mb-12 text-center max-w-4xl mx-auto animate-fade-up animate-delay-1">
            {t('doc_hero_subtitle') || 'البرمجة اليوم مش "مجال خاص" لفئة معينة. هي مهارة أساسية لأي شخص مهما كان تخصصه، لأنها دخلت في كل مجال من مجالات الحياة. الطب، الهندسة، المحاسبة، الأعمال، المحتوى، التعليم... كله صار يعتمد على التقنية بطريقة أو بأخرى.'}
          </h2>

          {/* Cards Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            {/* Web Development Card */}
            <div className="card animate-on-scroll">
              <div className="card-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <WebDevIcon />
              </div>
              <h3 className="card-title">{t('card_web') || 'تطوير الويب'}</h3>
              <p className="card-text">{t('card_web_desc') || 'المواقع والتطبيقات اللي بتفتحها كل يوم، كلها مبنية بأسطر كود.'}</p>
            </div>

            {/* Mobile Development Card */}
            <div className="card animate-on-scroll">
              <div className="card-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                <MobileDevIcon />
              </div>
              <h3 className="card-title">{t('card_mobile') || 'تطبيقات الهواتف'}</h3>
              <p className="card-text">{t('card_mobile_desc') || 'الأندرويد والـ iOS.. كيف فكرة براسك ممكن تصير تطبيق بإيد الملايين.'}</p>
            </div>

            {/* AI Card */}
            <div className="card animate-on-scroll">
              <div className="card-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                <AIIcon />
              </div>
              <h3 className="card-title">{t('card_ai') || 'الذكاء الاصطناعي'}</h3>
              <p className="card-text">{t('card_ai_desc') || 'كيف تعلم الآلة تفكر، تحلل البيانات، وتتوقع شو رح يصير بالمستقبل.'}</p>
            </div>

            {/* All Fields Card */}
            <div className="card animate-on-scroll">
              <div className="card-icon" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                <AllFieldsIcon />
              </div>
              <h3 className="card-title">{t('card_all') || 'في كل المجالات'}</h3>
              <p className="card-text">{t('card_all_desc') || 'حتى الدكاترة والمهندسين والمحاسبين بيحتاجوها عشان يسهلوا شغلهم ويحلوا مشاكلهم المعقدة.'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Concept Section */}
      <section id="core" className="section core-section py-20 bg-muted/30">
        <div className="container px-4 mx-auto">
          <h2 className="section-title text-3xl md:text-4xl font-bold text-center mb-6">
            {t('ps_title') || 'حل المشكلات (Problem Solving): هون السر!'}
          </h2>
          <p className="section-text text-lg text-muted-foreground text-center mb-12 max-w-3xl mx-auto">
            {t('ps_text') || 'يمكن تفكر إنك تتعلم لغة زي Python أو C++ هو الهدف، بس الحقيقة اللغة هاي مجرد "أداة" زي القلم. الشطارة اللي بتميز المبتدئ عن المحترف هي مهارة حل المشكلات (Problem Solving). بدونها، رح تكون مجرد "كاتب كود" مش "مهندس برمجيات" فاهم الطبخة.'}
          </p>

          {/* Process Steps */}
          <div className="max-w-4xl mx-auto">
            <div className="process-steps">
              {/* Step 1 */}
              <div className="process-step animate-on-scroll">
                <div className="step-number">1</div>
                <h3 className="step-title">{t('step1_ps') || 'تفكيك المشكلة'}</h3>
                <p className="step-text">{t('step1_ps_desc') || 'كيف تقسم المشكلة الكبيرة لأجزاء صغيرة تقدر عليها.'}</p>
              </div>

              {/* Arrow for desktop */}
              <div className="hidden md:block text-primary animate-pulse-scale">
                <div className='left-arrow'><i className="fa-solid fa-arrow-left text-3xl" /></div>
              </div>

              {/* Step 2 */}
              <div className="process-step animate-on-scroll">
                <div className="step-number">2</div>
                <h3 className="step-title">{t('step2_ps') || 'بناء الخوارزمية'}</h3>
                <p className="step-text">{t('step2_ps_desc') || 'ترسم "خطة" الحل بمخك أو على ورقة قبل ما تكتب ولا حرف كود.'}</p>
              </div>

              {/* Arrow for desktop */}
              <div className="hidden md:block text-primary animate-pulse-scale">
                <div className='left-arrow'><i className="fa-solid fa-arrow-left text-3xl" /></div>
              </div>

              {/* Step 3 */}
              <div className="process-step animate-on-scroll">
                <div className="step-number">3</div>
                <h3 className="step-title">{t('step3_ps') || 'تحويل الحل لكود'}</h3>
                <p className="step-text">{t('step3_ps_desc') || 'تترجم هالخطة للغة يفهمها الكمبيوتر.'}</p>
              </div>
            </div>

            {/* Arrows for mobile */}
            <div className="md:hidden flex items-center justify-center gap-4 my-8">
              <i className="fa-solid fa-arrow-down text-primary animate-bounce" />
              <i className="fa-solid fa-arrow-down text-primary animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>

            <div className="bridge-text animate-on-scroll">
              <p>{t('gym_text') || 'وعشان هيك، البرمجة التنافسية هي "الجيم" (Gym) اللي رح تربي فيه عضلات مخك البرمجية.'}</p>
            </div>
          </div>
        </div>
      </section>

      {/* What is CP Section */}
      <section id="what" className="section what-section py-20">
        <div className="container px-4 mx-auto">
          <h2 className="section-title text-3xl md:text-4xl font-bold text-center mb-6">
            {t('cp_title') || 'شو يعني برمجة تنافسية؟'}
          </h2>

          {/* Definition Box */}
          <div className="definition-box animate-on-scroll">
            <div className="definition-icon">
              <i className="fa-solid fa-trophy text-4xl text-yellow-400" />
            </div>
            <p className="definition-text text-xl">
              {t('cp_def') || 'رياضة ذهنية.. مبرمجين بتنافسوا مين يحل مشاكل برمجية معقدة بوقت محدد وشروط معينة.'}
            </p>
          </div>

          <h3 className="subsection-title text-2xl md:text-3xl font-bold text-center mb-12">
            {t('why_cp_title') || 'ليش تهتم؟'}
          </h3>

          {/* Benefits Grid */}
          <div className="benefits-grid">
            {[1, 2, 3, 4, 5, 6].map((benefit) => (
              <div key={benefit} className="benefit-card animate-on-scroll">
                <div className="benefit-icon">
                  {benefit === 1 && <i className="fa-solid fa-graduation-cap text-gray-800 dark:text-gray-200" />}
                  {benefit === 2 && <i className="fa-solid fa-briefcase text-orange-600 dark:text-orange-400" />}
                  {benefit === 3 && <i className="fa-solid fa-bolt text-yellow-500 dark:text-yellow-400" />}
                  {benefit === 4 && <i className="fa-regular fa-circle-check text-green-500 dark:text-green-400" />}
                  {benefit === 5 && <i className="fa-solid fa-globe text-blue-500 dark:text-blue-400" />}
                  {benefit === 6 && <i className="fa-solid fa-lightbulb text-yellow-400 dark:text-yellow-300" />}
                </div>
                <h4 className="text-lg font-bold text-primary mb-3">
                  {t(`benefit${benefit}_title`) || `Benefit ${benefit} Title`}
                </h4>
                <p className="text-muted-foreground">
                  {t(`benefit${benefit}_desc`) || `Benefit ${benefit} description text goes here.`}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Start with Basics Section */}
      <section id="basics" className="basics-section">
        <div className="container px-4 mx-auto">
          <h2 className="section-title text-3xl md:text-4xl font-bold text-center mb-6">
            {t('basics_why_title') || 'ليش مهم نبدأ بالأساسيات؟'}
          </h2>
          
          <div className="basics-content animate-on-scroll">
            <p className="basics-text">
              {t('basics_why_text') || 'المسار اللي إحنا بنمشيك فيه مش "حل سحري" ولا shortcut. هو عبارة عن خطوات مدروسة بتعطيك أساس قوي بالبرمجة... أساس بخليك تتوسع وتبرع بالمجال اللي بتحبه، سواء كان: الذكاء الاصطناعي، تطوير الويب، الأمن السيبراني، علم البيانات، أو حتى مجال مش تقني بالأصل. لأن اللي بمتلك أساس صح... بقدر يبدع بأي فرع بختاره.'}
            </p>
            
            <div className="conclusion-box">
              <h3 className="text-2xl font-bold text-primary mb-4">
                {t('doc_conclusion_title') || 'الخلاصة'}
              </h3>
              <p className="text-lg text-muted-foreground">
                {t('doc_conclusion_text') || 'البرمجة مش هدف بحد ذاتها، هي "أداة". أداة بتخليك تفكر أحسن، تحل مشاكل أسرع، وتبتكر حلول ما حد فكر فيها. وكل خطوة بتتعلمها هون بتكون جزء من الأساس اللي راح يفتح لك باب للتخصص اللي بتحبه....'}
              </p>
            </div>
            
            <div className="text-center mt-8">
              <Button asChild size="lg" className="gap-2 px-8 py-6 text-lg">
                <Link to={'/roadmap'}>
                  {t('start_journey') || 'ابدأ رحلتك في التدريب!'}
                  {dir === 'rtl' ? <ArrowLeft className="h-5 w-5" /> : <ArrowRight className="h-5 w-5" />}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Competitions Section */}
      <section id="competitions" className="competitions-section">
        <div className="container px-4 mx-auto">
          <h2 className="section-title text-3xl md:text-4xl font-bold text-center mb-6 text-white">
            {t('comp_title') || 'المسابقات البرمجية المحلية والعالمية'}
          </h2>
          <p className="section-intro text-lg text-white/90 text-center mb-12 max-w-3xl mx-auto">
            {t('comp_intro') || 'المشاركة في المسابقات البرمجية هي أفضل طريقة لاختبار مهاراتك وتطويرها. سواء كنت طالب مدرسة أو جامعة، يوجد مسابقات تناسب مستواك:'}
          </p>

          {/* Competitions Grid */}
          <div className="competitions-grid">
            {/* Schools Competitions */}
            <div className="competition-card animate-on-scroll">
              <div className="competition-icon">
                <i className="fa-solid fa-school text-primary" />
              </div>
              <h3 className="competition-title">
                {t('comp_schools') || 'مسابقات المدارس'}
              </h3>
              <ul className="competition-list">
                <li>
                  <strong>{t('comp_ic_title') || 'مسابقة الطالب المبرمج (IC):'}</strong>{' '}
                  <span>{t('comp_ic_text') || 'مسابقة تقام من وزارة التربية والتعليم لحل المشاكل'}</span>
                </li>
                <li>
                  <strong>{t('comp_afpc_title') || 'مسابقة مبرمجي المستقبل العربية (AFPC):'}</strong>{' '}
                  <span>{t('comp_afpc_text') || 'مسابقة تقام في الأردن - جامعة العلوم التطبيقية، تجمع طلبة المدارس من الدول العربية ويتنافسون في حل المشكلات'}</span>
                </li>
                <li>
                  <strong>{t('comp_ioi_title') || 'الأولمبياد الدولي للمعلوماتية (IOI):'}</strong>{' '}
                  <span>{t('comp_ioi_text') || 'أكبر منافسة لطلبة المدارس في حل المشكلات وتكون على مستوى العالم، بتقدر تقول عنها "كأس العالم في حل المشكلات لطلبة المدارس"'}</span>
                </li>
              </ul>
            </div>

            {/* Universities Competitions */}
            <div className="competition-card animate-on-scroll">
              <div className="competition-icon">
                <i className="fa-solid fa-building-columns text-primary" />
              </div>
              <h3 className="competition-title">
                {t('comp_unis') || 'مسابقات الجامعات'}
              </h3>
              <ul className="competition-list">
                <li>
                  <strong>{t('comp_hcj') || 'هيبرون كود جام (HCJ):'}</strong>{' '}
                  <span>{t('comp_hcj_desc') || 'مسابقة برمجة تُقام في جامعة الخليل، تجمع الطلاب من مختلف جامعات الوطن لحل المشكلات.'}</span>
                </li>
                <li>
                  <strong>{t('comp_pcpc') || 'المسابقة الفلسطينية للبرمجة (PCPC):'}</strong>{' '}
                  <span>{t('comp_pcpc_desc') || 'المسابقة الرسمية لجامعات فلسطين، ويتأهّل الفائزون منها إلى المسابقة العربية.'}</span>
                </li>
                <li>
                  <strong>{t('comp_acpc') || 'المسابقة العربية للبرمجة (ACPC):'}</strong>{' '}
                  <span>{t('comp_acpc_desc') || 'مسابقة إقليمية كبرى تضم أفضل فرق الجامعات العربية، ويتأهّل الفائزون منها إلى العالمية.'}</span>
                </li>
                <li>
                  <strong>{t('comp_icpc') || 'المسابقة العالمية للبرمجة (ICPC):'}</strong>{' '}
                  <span>{t('comp_icpc_desc') || 'أكبر مسابقة جامعية في العالم لحل المشكلات، تجمع عباقرة العالم في حل المشكلات.'}</span>
                </li>
              </ul>
            </div>

            {/* Open Competitions */}
            <div className="competition-card animate-on-scroll">
              <div className="competition-icon">
                <i className="fas fa-globe-americas text-primary" />
              </div>
              <h3 className="competition-title">
                {t('comp_open') || 'مسابقات مفتوحة للجميع'}
              </h3>
              <ul className="competition-list">
                <li>
                  <strong>{t('comp_codeforces') || 'Codeforces Rounds:'}</strong>{' '}
                  <span>{t('comp_codeforces_desc') || 'مسابقات أسبوعية ومتنوعة'}</span>
                </li>
                <li>
                  <strong>{t('comp_atcoder') || 'AtCoder Contests:'}</strong>{' '}
                  <span>{t('comp_atcoder_desc') || 'مسابقات يابانية شهيرة'}</span>
                </li>
                <li>
                  <strong>{t('comp_leetcode') || 'LeetCode Contests:'}</strong>{' '}
                  <span>{t('comp_leetcode_desc') || 'مسابقات أسبوعية وثنائية الأسبوع'}</span>
                </li>
                <li>
                  <strong>{t('comp_topcoder') || 'Topcoder:'}</strong>{' '}
                  <span>{t('comp_topcoder_desc') || 'من أقدم منصات المسابقات'}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Competition Tips */}
          <div className="competition-tips animate-on-scroll">
            <h3 className="text-2xl font-bold text-primary mb-6">
              {t('comp_tips_title') || 'نصائح للمشاركة الفعالة في المسابقات:'}
            </h3>
            <ol>
              {[1, 2, 3, 4, 5].map((tip) => (
                <li key={tip} className="mb-4 flex items-start gap-3">
                  <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-1">
                    {tip}
                  </span>
                  <span>
                    <strong>{t(`comp_tip${tip}_title`) || `Tip ${tip} Title`}</strong>{' '}
                    {t(`comp_tip${tip}_text`) || `Tip ${tip} description text goes here.`}
                  </span>
                </li>
              ))}
            </ol>
            <p className="final-tip text-primary p-4 bg-primary/10 rounded-lg border-r-4 border-primary">
              {t('comp_final_note') || 'وبالتوقع النهائي: كل ما تتدرب كل ما تحسن المستوى. بالإضافة إلى أن المشاركة في المسابقات البرمجية لها تأثير كبير على تطور الشخص مهنياً وأكاديمياً وتوسيع دائرة علاقاته.'}
            </p>
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section id="community" className="section community-section bg-gradient-to-br from-primary to-primary/80 py-20">
        <div className="container px-4 mx-auto">
          <h2 className="section-title text-3xl md:text-4xl font-bold text-center mb-6 text-white">
            {t('nav_community') || 'ما تمشي بهالطريق لحالك'}
          </h2>
          <p className="section-intro text-lg text-white/90 text-center mb-12 max-w-3xl mx-auto">
            {t('community_intro') || 'انضم لمجتمعنا النشط على Discord! شارك خبراتك، اسأل الأسئلة، وكن جزءاً من مجتمع المبرمجين التنافسيين. التطوير مش سهل لوحدك، لكن مع المجتمع رح يكون أسهل وأمتع!'}
          </p>
          
          <div className="flex flex-col items-center gap-6">
            <div className="max-w-xs w-full mx-auto animate-on-scroll">
              <a 
                href="https://discord.gg/68u2duwKuu" 
                target="_blank" 
                rel="noopener noreferrer"
                className="platform-card no-external-icon block"
              >
                <div className="platform-shimmer" />
                <div className="platform-glow" />
                <div className="platform-inner">
                  <div className="platform-icon-wrapper">
                    <i className="fa-brands fa-discord text-indigo-600 dark:text-indigo-400 text-2xl" />
                  </div>
                  <div className="platform-text">
                    <p className="platform-name text-indigo-600 dark:text-indigo-400 font-bold text-lg">Discord</p>
                    <p className="platform-subtitle text-indigo-500/70 dark:text-indigo-300/70 text-sm">
                      {t('join_community') || 'انضم للمجتمع'}
                    </p>
                  </div>
                  <div className="platform-arrow">
                    <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" viewBox="0 0 24 24" stroke="currentColor" fill="none">
                      <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"></path>
                    </svg>
                  </div>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Load Font Awesome */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    </div>
  );
}