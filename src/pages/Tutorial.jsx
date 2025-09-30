import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Camera, 
  Lightbulb, 
  Target, 
  CheckCircle, 
  ArrowRight,
  ArrowLeft,
  Play,
  Download,
  Upload
} from 'lucide-react';

const Tutorial = () => {
  const tutorials = [
    {
      id: 1,
      title: 'Perfecte Productfoto\'s',
      description: 'Leer hoe je professionele productfoto\'s maakt',
      duration: '5 min',
      difficulty: 'Beginner',
      steps: [
        'Upload je productfoto',
        'Kies de juiste belichting',
        'Pas achtergrond aan',
        'Download het resultaat'
      ],
      beforeImage: '/foto\'s/Juwelier/Horloge Voor.png',
      afterImage: '/foto\'s/Juwelier/Horloge na.jpg'
    },
    {
      id: 2,
      title: 'Food Photography Tips',
      description: 'Maak je gerechten onweerstaanbaar',
      duration: '7 min',
      difficulty: 'Gemiddeld',
      steps: [
        'Zorg voor goede belichting',
        'Gebruik de juiste hoek',
        'Voeg warmte toe aan kleuren',
        'Verhoog contrast en scherpte'
      ],
      beforeImage: '/foto\'s/Restaurant/Biefstuk voor.png',
      afterImage: '/foto\'s/Restaurant/Biefstuk na.jpg'
    },
    {
      id: 3,
      title: 'Vastgoed Fotografie',
      description: 'Laat je eigendom in het beste licht zien',
      duration: '6 min',
      difficulty: 'Gevorderd',
      steps: [
        'Optimaliseer natuurlijk licht',
        'Corrigeer perspectief',
        'Verbeter kleuren en contrast',
        'Voeg professionele finishing toe'
      ],
      beforeImage: '/foto\'s/Makelaar/Voor.jpeg',
      afterImage: '/foto\'s/Makelaar/Na.jpeg'
    }
  ];

  const tips = [
    {
      icon: Camera,
      title: 'Goede Basisfoto',
      description: 'Start met een scherpe foto in goede resolutie. Vermijd overbelichting en zorg voor stabiele opname.'
    },
    {
      icon: Lightbulb,
      title: 'Natuurlijk Licht',
      description: 'Gebruik daglicht wanneer mogelijk. Vermijd harde schaduwen en zorg voor gelijkmatige belichting.'
    },
    {
      icon: Target,
      title: 'Focus op Details',
      description: 'Zorg dat het hoofdonderwerp scherp is. Gebruik de juiste diepte van veld voor je doel.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Link 
            to="/dashboard" 
            className="inline-flex items-center px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm border border-gray-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Terug naar Editor
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            PHIXO Tutorial Center
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Leer hoe je de beste resultaten behaalt met onze AI-fotobewerkingstools
          </p>
        </motion.div>

        {/* Quick Tips */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Snelle Tips</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {tips.map((tip, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-lg">
                <tip.icon className="w-12 h-12 text-blue-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {tip.title}
                </h3>
                <p className="text-gray-600">{tip.description}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tutorials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Stap-voor-Stap Tutorials</h2>
          <div className="space-y-8">
            {tutorials.map((tutorial, index) => (
              <div key={tutorial.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="md:flex">
                  {/* Images */}
                  <div className="md:w-1/2 p-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">Voor</p>
                        <img 
                          src={tutorial.beforeImage} 
                          alt="Voor bewerking"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500 mb-2">Na</p>
                        <img 
                          src={tutorial.afterImage} 
                          alt="Na bewerking"
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="md:w-1/2 p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                        {tutorial.difficulty}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                        {tutorial.duration}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {tutorial.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{tutorial.description}</p>
                    
                    <div className="space-y-2 mb-6">
                      {tutorial.steps.map((step, stepIndex) => (
                        <div key={stepIndex} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-700">{step}</span>
                        </div>
                      ))}
                    </div>

                    <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                      <Play className="w-4 h-4" />
                      Start Tutorial
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Best Practices */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white"
        >
          <h2 className="text-2xl font-bold mb-4">Best Practices</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">✨ Voor Upload</h3>
              <ul className="space-y-1 text-blue-100">
                <li>• Gebruik hoge resolutie (minimaal 1080p)</li>
                <li>• Zorg voor goede belichting</li>
                <li>• Houd de camera stabiel</li>
                <li>• Vermijd overbelichting</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">🎯 Na Bewerking</h3>
              <ul className="space-y-1 text-blue-100">
                <li>• Download in hoogste kwaliteit</li>
                <li>• Bewaar originelen als backup</li>
                <li>• Test verschillende instellingen</li>
                <li>• Gebruik consistente stijl</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Tutorial;