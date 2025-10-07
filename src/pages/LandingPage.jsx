import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Zap, Target, Camera, Utensils, Home, Gem, ShoppingBag, X, Eye } from 'lucide-react';
import { BackgroundGradient } from '@/components/ui/background-gradient';

const LandingPage = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const openModal = (category) => {
    setSelectedCategory(category);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedCategory(null);
  };

  const categories = [
    {
      id: 'makelaars',
      title: 'Makelaars',
      icon: Home,
      description: 'Transformeer vastgoedfoto\'s naar professionele presentaties die verkopen',
      beforeImage: '/images/Voor.jpeg',
      afterImage: '/images/Na.jpeg',
      improvement: '+85% meer interesse',
      examples: [
        {
          before: '/images/Voor.jpeg',
          after: '/images/Na.jpeg',
          title: 'Woonkamer Transformatie'
        },
        {
          before: '/images/WOONKAMER 2 voor.jpeg',
          after: '/images/WOONKAMER 2 na.png',
          title: 'Woonkamer Upgrade'
        },
        {
          before: '/images/Woning 4 voor.png',
          after: '/images/Woning 4 na.png',
          title: 'Woning Styling'
        }
      ]
    },


    {
      id: 'marktplaats',
      title: 'Marktplaats/Amazon',
      icon: ShoppingBag,
      description: 'Verhoog je verkoop met professionele productfoto\'s voor online marktplaatsen',
      beforeImage: '/images/horloge-voor-placeholder.svg',
      afterImage: '/images/horloge-na-placeholder.svg',
      improvement: '+150% conversie',
      examples: [
        {
          before: '/images/horloge-voor-placeholder.svg',
          after: '/images/horloge-na-placeholder.svg',
          title: 'Luxe Horloge'
        },
        {
          before: '/images/horloge-voor-placeholder.svg',
          after: '/images/horloge-na-placeholder.svg',
          title: 'Elektronische Gadgets'
        },
        {
          before: '/images/horloge-voor-placeholder.svg',
          after: '/images/horloge-na-placeholder.svg',
          title: 'Fashion Accessoires'
        }
      ]
    },
    {
      id: 'restaurants',
      title: 'Restaurants',
      icon: Utensils,
      description: 'Verhoog je online bestellingen met appetijt-opwekkende foto\'s',
      beforeImage: '/images/WOONKAMER 2 voor.jpeg',
      afterImage: '/images/WOONKAMER 2 na.png',
      improvement: '+95% meer bestellingen',
      examples: [
        {
          before: '/images/WOONKAMER 2 voor.jpeg',
          after: '/images/WOONKAMER 2 na.png',
          title: 'Restaurant Interieur'
        },
        {
          before: '/images/Voor.jpeg',
          after: '/images/Na.jpeg',
          title: 'Dining Area'
        },
        {
          before: '/images/Woning 4 voor.png',
          after: '/images/Woning 4 na.png',
          title: 'Private Dining'
        }
      ]
    },
    {
      id: 'ecommerce',
      title: 'E-commerce',
      icon: ShoppingBag,
      description: 'Optimaliseer productfoto\'s voor maximale online verkoop',
      beforeImage: '/images/horloge-voor-placeholder.svg',
      afterImage: '/images/horloge-na-placeholder.svg',
      improvement: '+110% verkoop',
      examples: [
        {
          before: '/images/horloge-voor-placeholder.svg',
          after: '/images/horloge-na-placeholder.svg',
          title: 'Product Showcase'
        },
        {
          before: '/images/horloge-voor-placeholder.svg',
          after: '/images/horloge-na-placeholder.svg',
          title: 'Lifestyle Shots'
        },
        {
          before: '/images/horloge-voor-placeholder.svg',
          after: '/images/horloge-na-placeholder.svg',
          title: 'Detail Close-ups'
        }
      ]
    },
    {
      id: 'mockups',
      title: 'Mockups',
      icon: Target,
      description: 'Professionele mockups voor branding en presentaties',
      beforeImage: '/images/horloge-voor-placeholder.svg',
      afterImage: '/images/horloge-na-placeholder.svg',
      improvement: '+200% professionele uitstraling',
      examples: [
        {
          before: '/images/horloge-voor-placeholder.svg',
          after: '/images/horloge-na-placeholder.svg',
          title: 'Brand Mockups'
        },
        {
          before: '/images/horloge-voor-placeholder.svg',
          after: '/images/horloge-na-placeholder.svg',
          title: 'Packaging Design'
        },
        {
          before: '/images/horloge-voor-placeholder.svg',
          after: '/images/horloge-na-placeholder.svg',
          title: 'Marketing Materials'
        }
      ]
    }
  ];

  const BeforeAfterCard = ({ category }) => {
    const IconComponent = category.icon;
    
    return (
      <div 
        className="glass-effect border-white/10 p-6 rounded-[22px] flex flex-col h-full cursor-pointer transition-all hover:shadow-2xl transform hover:-translate-y-2"
        onClick={() => openModal(category)}
      >
          <div className="flex items-center mb-4">
            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-3 rounded-lg mr-4">
              <IconComponent className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">{category.title}</h3>
              <p className="text-sm text-white/70">{category.description}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="relative">
              <img 
                src={category.beforeImage} 
                alt={`Voor - ${category.title}`}
                className="w-full h-48 object-cover rounded-lg"
              />
              <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold">
                VOOR
              </div>
            </div>
            <div className="relative">
              <img 
                src={category.afterImage} 
                alt={`Na - ${category.title}`}
                className="w-full h-48 object-cover rounded-lg"
              />
              <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold">
                NA
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 p-3 rounded-lg mb-4">
            <p className="text-sm font-semibold text-green-400">{category.improvement}</p>
          </div>
          
          <div className="flex justify-center">
            <button className="flex items-center px-4 py-2 button-glow text-white rounded-lg text-sm font-medium">
              <Eye className="w-4 h-4 mr-2" />
              Toon meer
            </button>
          </div>
      </div>
    );
  };

  const Modal = ({ isOpen, onClose, category }) => {
    const [currentExample, setCurrentExample] = useState(0);
    
    if (!isOpen || !category) return null;

    const examples = category.examples || [];
    const totalExamples = examples.length;

    const nextExample = () => {
      setCurrentExample((prev) => (prev + 1) % totalExamples);
    };

    const prevExample = () => {
      setCurrentExample((prev) => (prev - 1 + totalExamples) % totalExamples);
    };

    // Handle escape key press
    React.useEffect(() => {
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      if (isOpen) {
        document.addEventListener('keydown', handleEscape);
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        setCurrentExample(0); // Reset to first example when modal opens
      }

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
      };
    }, [isOpen, onClose]);

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4"
        onClick={onClose}
      >
        <div 
          className="glass-effect border-white/10 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex justify-between items-start p-4 sm:p-6 border-b border-white/10">
            <div className="flex items-start flex-1 mr-4">
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-2 sm:p-3 rounded-lg mr-3 sm:mr-4 flex-shrink-0">
                <category.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg sm:text-2xl font-bold text-white break-words">{category.title}</h2>
                <p className="text-sm sm:text-base text-white/70 break-words">{category.description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-white/70" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-4 sm:p-6">
            {/* Gallery Navigation */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-white">
                {examples[currentExample]?.title || 'Voorbeeld'} ({currentExample + 1}/{totalExamples})
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={prevExample}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                  disabled={totalExamples <= 1}
                >
                  <ArrowRight className="w-5 h-5 text-white/70 rotate-180" />
                </button>
                <button
                  onClick={nextExample}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                  disabled={totalExamples <= 1}
                >
                  <ArrowRight className="w-5 h-5 text-white/70" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
              {/* Before Image */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center flex-wrap">
                  <span className="bg-red-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold mr-2 sm:mr-3 mb-1 sm:mb-0">
                    VOOR
                  </span>
                  <span className="text-sm sm:text-base">Originele foto</span>
                </h3>
                <div className="relative group">
                  <img 
                    src={examples[currentExample]?.before || category.beforeImage} 
                    alt={`Voor - ${examples[currentExample]?.title || category.title}`}
                    className="w-full h-auto rounded-xl shadow-lg"
                  />
                </div>
              </div>

              {/* After Image */}
              <div className="space-y-3 sm:space-y-4">
                <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center flex-wrap">
                  <span className="bg-green-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold mr-2 sm:mr-3 mb-1 sm:mb-0">
                    NA
                  </span>
                  <span className="text-sm sm:text-base">Bewerkte foto</span>
                </h3>
                <div className="relative group">
                  <img 
                    src={examples[currentExample]?.after || category.afterImage} 
                    alt={`Na - ${examples[currentExample]?.title || category.title}`}
                    className="w-full h-auto rounded-xl shadow-lg"
                  />
                </div>
              </div>
            </div>

            {/* Example Thumbnails */}
            <div className="mt-6 flex justify-center gap-2 flex-wrap">
              {examples.map((example, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentExample(index)}
                  className={`p-1 rounded-lg transition-all ${
                    currentExample === index 
                      ? 'ring-2 ring-purple-500 bg-purple-500/20' 
                      : 'hover:bg-white/10'
                  }`}
                >
                  <img
                    src={example.after}
                    alt={example.title}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                </button>
              ))}
            </div>

            {/* Improvement Stats */}
            <div className="mt-6 sm:mt-8 bg-gradient-to-r from-green-500/20 to-blue-500/20 p-4 sm:p-6 rounded-xl">
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold text-green-400 mb-2">{category.improvement}</p>
                <p className="text-sm sm:text-base text-white/70">Verbetering in klantinteresse</p>
              </div>
            </div>

            {/* Call to Action */}
            <div className="mt-6 sm:mt-8 text-center">
              <Link
                to="/register"
                className="inline-flex items-center px-6 sm:px-8 py-3 sm:py-4 button-glow text-white font-semibold rounded-xl text-sm sm:text-base"
                onClick={onClose}
              >
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Start nu met je eigen foto's
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950">
      {/* Navigation */}
      <nav className="glass-effect border-white/10 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg mr-3">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <span className="text-2xl font-bold gradient-text">
                PHIXO
              </span>
            </div>
            <div className="flex space-x-3">
              <Link 
                to="/login" 
                className="text-white/70 hover:text-white px-5 py-2.5 rounded-lg transition-colors font-medium border border-white/20 hover:border-white/40"
              >
                Inloggen
              </Link>
              <Link 
                to="/register" 
                className="button-glow text-white px-6 py-2.5 rounded-lg font-medium flex items-center"
              >
                Gratis Account <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="gradient-text">
              AI-Powered
            </span>
            <br />
            <span className="text-white">Photo Magic</span>
          </h1>
          <p className="text-xl md:text-2xl text-white/70 mb-8 max-w-3xl mx-auto">
            Transform gewone foto's in professionele advertenties met onze geavanceerde AI-technologie. 
            Perfect voor makelaars en e-commerce.
          </p>
          
          {/* Free Credits Highlight */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6 rounded-2xl mb-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-center mb-2">
              <Zap className="w-6 h-6 mr-2" />
              <span className="text-lg font-semibold">Gratis Credits</span>
            </div>
            <p className="text-2xl font-bold mb-1">10 Credits om uit te proberen</p>
            <p className="text-green-100">Probeer onze AI-technologie volledig gratis uit</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 glass-effect border-white/10 rounded-2xl p-8 mb-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">10,000+</div>
              <div className="text-white/70">Foto's Geoptimaliseerd</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-400 mb-2">95%</div>
              <div className="text-white/70">Conversie Verbetering</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-400 mb-2">500+</div>
              <div className="text-white/70">Tevreden Klanten</div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/register" 
              className="button-glow text-white px-8 py-4 rounded-xl text-lg font-semibold flex items-center justify-center"
            >
              Start Gratis Trial <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link 
              to="/login" 
              className="border-2 border-white/30 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:border-white/50 hover:bg-white/10 transition-all duration-300 flex items-center justify-center"
            >
              Al een account? Inloggen
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Showcase */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Perfect voor elke branche
            </h2>
            <p className="text-xl text-white/70 max-w-3xl mx-auto">
              Onze AI-technologie is gespecialiseerd in verschillende sectoren, 
              elk met unieke optimalisaties voor maximale impact.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category) => (
              <BeforeAfterCard key={category.id} category={category} />
            ))}
          </div>
        </div>
      </section>

      {/* AI Technology Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-900 to-purple-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              De kracht van geavanceerde AI
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Wij gebruiken de meest geavanceerde AI-modellen en zijn continu bezig met verbeteringen, 
              modeltraining en applicatie-optimalisatie voor de beste resultaten.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl text-center">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Beste AI-Modellen</h3>
              <p className="text-blue-100">
                We gebruiken state-of-the-art machine learning modellen die continu worden geüpdatet 
                met de nieuwste technologische ontwikkelingen.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl text-center">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Continue Verbeteringen</h3>
              <p className="text-blue-100">
                Ons team werkt 24/7 aan het verbeteren van onze algoritmes en het toevoegen van 
                nieuwe functies voor nog betere resultaten.
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl text-center">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Geoptimaliseerde Prestaties</h3>
              <p className="text-blue-100">
                Onze applicatie is geoptimaliseerd voor snelheid en efficiëntie, zodat je binnen 
                seconden professionele resultaten krijgt.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Klaar om te beginnen?
          </h2>
          <p className="text-xl text-white/70 mb-8">
            Start vandaag nog met 10 credits om uit te proberen en ervaar zelf de kracht van AI-fotografie.
          </p>
          
          <div className="glass-effect border-white/10 p-8 rounded-2xl max-w-md mx-auto mb-8">
            <div className="text-center">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Gratis Uitproberen</h3>
              <p className="text-4xl font-bold text-green-400 mb-2">10 Credits</p>
              <p className="text-white/70 mb-4">Om uit te proberen</p>
              <ul className="text-left text-white/70 space-y-2 mb-6">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  Alle AI-functies beschikbaar
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  Hoogste kwaliteit output
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                  Geen verborgen kosten
                </li>
              </ul>
            </div>
          </div>

          <Link 
            to="/register" 
            className="button-glow text-white px-12 py-4 rounded-xl text-xl font-semibold inline-flex items-center"
          >
            Gratis Account Aanmaken <ArrowRight className="ml-3 w-6 h-6" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="glass-effect border-white/10 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-2 rounded-lg mr-3">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">PHIXO</span>
            </div>
            <div className="flex space-x-6">
              <Link to="/login" className="hover:text-purple-400 transition-colors">Inloggen</Link>
              <Link to="/register" className="hover:text-purple-400 transition-colors">Registreren</Link>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-8 text-center text-white/60">
            <p>&copy; 2024 PHIXO. Alle rechten voorbehouden.</p>
          </div>
        </div>
      </footer>

      {/* Modal */}
      <Modal 
        isOpen={modalOpen} 
        onClose={closeModal} 
        category={selectedCategory} 
      />
    </div>
  );
};

export default LandingPage;