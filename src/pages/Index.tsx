
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Zap, Target, BarChart3, Clock, Users } from "lucide-react";
import GameInterface from "@/components/GameInterface";
import Tutorial from "@/components/Tutorial";
import PerformanceStats from "@/components/PerformanceStats";

const Index = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'tutorial' | 'game' | 'stats'>('landing');
  const [showQuickStart, setShowQuickStart] = useState(false);

  const features = [
    {
      icon: Brain,
      title: "Science-Based Training",
      description: "Built on peer-reviewed N-Back research for proven cognitive enhancement"
    },
    {
      icon: Zap,
      title: "Instant Access",
      description: "No registration required - start training your working memory immediately"
    },
    {
      icon: Target,
      title: "Adaptive Difficulty",
      description: "AI-powered system adjusts challenge level based on your performance"
    },
    {
      icon: BarChart3,
      title: "Real-Time Analytics",
      description: "Track your progress with detailed performance metrics and insights"
    },
    {
      icon: Clock,
      title: "Flexible Sessions",
      description: "Train anywhere, anytime with sessions from 5-20 minutes"
    },
    {
      icon: Users,
      title: "Privacy First",
      description: "No personal data collection - your training stays completely private"
    }
  ];

  const stats = [
    { label: "Active Users", value: "180K+", description: "training daily" },
    { label: "Sessions Completed", value: "2.4M+", description: "successful training rounds" },
    { label: "Average Improvement", value: "23%", description: "in working memory scores" },
    { label: "User Satisfaction", value: "4.8/5", description: "rating from feedback" }
  ];

  if (currentView === 'tutorial') {
    return <Tutorial onComplete={() => setCurrentView('game')} onBack={() => setCurrentView('landing')} />;
  }

  if (currentView === 'game') {
    return <GameInterface onBack={() => setCurrentView('landing')} onViewStats={() => setCurrentView('stats')} />;
  }

  if (currentView === 'stats') {
    return <PerformanceStats onBack={() => setCurrentView('landing')} onStartTraining={() => setCurrentView('game')} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="text-center space-y-6 mb-16">
          <Badge variant="secondary" className="mb-4 px-4 py-2 text-sm font-medium bg-blue-100 text-blue-700 border-blue-200">
            🧠 Science-Backed Cognitive Training
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent leading-tight">
            N-Back Brain Training
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Enhance your working memory and cognitive performance with scientifically-validated N-Back exercises. 
            Start training immediately - no signup required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-8">
            <Button 
              size="lg" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              onClick={() => setCurrentView('game')}
            >
              Start Training Now
              <Zap className="ml-2 h-5 w-5" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg"
              className="px-8 py-4 text-lg font-semibold rounded-xl border-2 border-blue-200 hover:border-blue-300 transition-all duration-200"
              onClick={() => setCurrentView('tutorial')}
            >
              Quick Tutorial
              <Brain className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-200">
              <CardContent className="pt-6">
                <div className="text-2xl md:text-3xl font-bold text-blue-600">{stat.value}</div>
                <div className="text-sm font-medium text-gray-900">{stat.label}</div>
                <div className="text-xs text-gray-500">{stat.description}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Grid */}
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
            Why Choose Our Platform?
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-200 hover:transform hover:scale-105">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
            How N-Back Training Works
          </h2>
          
          <Card className="max-w-4xl mx-auto border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">1</div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">Watch & Listen</h3>
                      <p className="text-gray-600">Observe visual positions and hear audio letters presented in sequence</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">2</div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">Remember N-Back</h3>
                      <p className="text-gray-600">Identify when current stimuli match those from N steps back</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">3</div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900">Adaptive Progress</h3>
                      <p className="text-gray-600">Difficulty automatically adjusts based on your performance</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl p-6">
                  <div className="text-center space-y-4">
                    <div className="text-2xl font-bold text-blue-700">Working Memory Enhancement</div>
                    <div className="grid grid-cols-3 gap-2">
                      {[...Array(9)].map((_, i) => (
                        <div key={i} className={`w-12 h-12 rounded border-2 ${i === 4 ? 'bg-blue-500 border-blue-600' : 'bg-white border-gray-300'}`}></div>
                      ))}
                    </div>
                    <div className="text-sm text-blue-600 font-medium">Visual Stimulus Example</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto border-0 shadow-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <CardContent className="p-8">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to Train Your Brain?</h2>
              <p className="text-blue-100 mb-6 text-lg">
                Join thousands of users improving their cognitive performance with evidence-based training.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="bg-white text-blue-600 hover:bg-gray-50 px-8 py-4 text-lg font-semibold rounded-xl"
                  onClick={() => setCurrentView('game')}
                >
                  Start Free Training
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-200"
                  onClick={() => setCurrentView('stats')}
                >
                  View Demo Stats
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
