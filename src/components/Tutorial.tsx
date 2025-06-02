import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ArrowRight, Brain, Eye, Ear, Target, CheckCircle } from 'lucide-react'
import VisualDemo1Back from './VisualDemo1Back'
import AudioDemo1Back from './AudioDemo1Back' // Added import

interface TutorialProps {
  onComplete: () => void
  onBack: () => void
}

const Tutorial = ({ onComplete, onBack }: TutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      title: 'Welcome to N-Back Training',
      icon: Brain,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Brain className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4">What is N-Back Training?</h2>
            <p className="text-gray-600 text-lg leading-relaxed">
              N-Back is a scientifically validated cognitive training exercise that improves your
              working memory - the mental workspace where you hold and manipulate information.
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-3">Key Benefits:</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Enhanced working memory capacity
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Improved focus and attention
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Better cognitive flexibility
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                Increased processing speed
              </li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: 'Visual N-Back',
      icon: Eye,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Eye className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Visual Stimulus Training</h2>
            <p className="text-gray-600 text-lg mb-6">
              Watch squares light up in different positions on a 3×3 grid. Your task is to remember
              the positions and identify when the current position matches one from N steps back.
            </p>
            <p className="text-gray-600 text-md mb-4">
              Below is an automated demonstration of <strong>1-Back</strong>. Notice how "Match!"
              appears when the currently highlighted square is the same as the one highlighted
              immediately before it.
            </p>
            <VisualDemo1Back />
          </div>

          <div className="space-y-4">
            <div className="text-center">
              {/* Keeping the static 2-Back example for now, or it could be removed/adjusted */}
              <Badge variant="secondary" className="mb-4">
                Static 2-Back Example
              </Badge>
              <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto mb-4">
                {[...Array(9)].map((_, index) => (
                  <div
                    key={index}
                    className={`w-16 h-16 border-2 rounded-lg ${
                      index === 4 ? 'bg-blue-500 border-blue-600' : 'bg-white border-gray-300'
                    }`}
                  />
                ))}
              </div>
              <div className="text-sm text-gray-600">Current position: Center</div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">How it works:</h3>
              <ol className="list-decimal list-inside space-y-1 text-gray-700">
                <li>Watch each square light up for 3 seconds</li>
                <li>Remember the sequence of positions</li>
                <li>Press "Visual Match" when current position = position 2 steps back</li>
                <li>Let the trial pass if there's no match</li>
              </ol>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Audio N-Back',
      icon: Ear,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Ear className="w-12 h-12 text-orange-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Audio Stimulus Training</h2>
            <p className="text-gray-600 text-lg mb-6">
              Listen to letters spoken in sequence. Remember the audio sequence and identify when
              the current letter matches one from N steps back.
            </p>
            <p className="text-gray-600 text-md mb-4">
              Below is a <strong>visual representation</strong> of an automated{' '}
              <strong>1-Back audio demo</strong>. Imagine you are hearing these letters. "Match!"
              will appear when the current letter is the same as the one immediately before it.
            </p>
            <AudioDemo1Back />
          </div>

          <div className="space-y-4">
            <div className="text-center">
              <Badge variant="secondary" className="mb-4">
                Static 2-Back Example
              </Badge>
              <div className="bg-white border-2 border-gray-300 rounded-lg p-8 mb-4">
                <div className="text-6xl font-bold text-orange-600">K</div>
              </div>
              <div className="text-sm text-gray-600">Current letter: K</div>
            </div>

            <div className="bg-orange-50 rounded-lg p-4">
              <h3 className="font-semibold mb-2">How it works:</h3>
              <ol className="list-decimal list-inside space-y-1 text-gray-700">
                <li>Listen to each letter (A through L)</li>
                <li>Remember the sequence of letters</li>
                <li>Press "Audio Match" when current letter = letter 2 steps back</li>
                <li>Each letter is presented for 3 seconds</li>
              </ol>
            </div>

            <div className="text-center">
              <div className="text-sm text-gray-500">
                💡 Tip: Audio works best with headphones or speakers
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Dual N-Back Challenge',
      icon: Target,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Target className="w-12 h-12 text-purple-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4">The Ultimate Challenge</h2>
            <p className="text-gray-600 text-lg mb-6">
              Dual N-Back combines both visual and audio stimuli simultaneously. This is the most
              challenging and effective form of working memory training.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="text-center">
              <h3 className="font-semibold mb-3">Visual Component</h3>
              <div className="grid grid-cols-3 gap-2 max-w-24 mx-auto mb-2">
                {[...Array(9)].map((_, index) => (
                  <div
                    key={index}
                    className={`w-6 h-6 border rounded ${
                      index === 2 ? 'bg-blue-500 border-blue-600' : 'bg-white border-gray-300'
                    }`}
                  />
                ))}
              </div>
              <div className="text-sm text-gray-600">Position: Top-right</div>
            </div>

            <div className="text-center">
              <h3 className="font-semibold mb-3">Audio Component</h3>
              <div className="w-16 h-16 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl font-bold text-orange-600">F</span>
              </div>
              <div className="text-sm text-gray-600">Letter: F</div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Dual N-Back Strategy:</h3>
            <ul className="space-y-1 text-gray-700">
              <li>• Track visual positions AND audio letters independently</li>
              <li>• You can have visual match, audio match, both, or neither</li>
              <li>• Press both buttons if both stimuli match</li>
              <li>• Start with lower N-levels (1-back or 2-back)</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      title: 'Training Tips & Strategy',
      icon: CheckCircle,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold mb-4">Maximize Your Training</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="bg-emerald-50 rounded-lg p-4">
                <h3 className="font-semibold text-emerald-800 mb-2">✅ Best Practices</h3>
                <ul className="space-y-1 text-emerald-700 text-sm">
                  <li>• Train 20 minutes, 3-5 times per week</li>
                  <li>• Stay focused - avoid distractions</li>
                  <li>• Use headphones for audio clarity</li>
                  <li>• Be patient - improvement takes time</li>
                  <li>• Aim for 80% accuracy before advancing</li>
                </ul>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">🧠 Mental Strategies</h3>
                <ul className="space-y-1 text-blue-700 text-sm">
                  <li>• Create mental "slots" for each position</li>
                  <li>• Use verbal rehearsal for audio sequences</li>
                  <li>• Don't try to memorize entire sequences</li>
                  <li>• Focus on the "feel" of the pattern</li>
                </ul>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-amber-50 rounded-lg p-4">
                <h3 className="font-semibold text-amber-800 mb-2">⚠️ Common Mistakes</h3>
                <ul className="space-y-1 text-amber-700 text-sm">
                  <li>• Advancing N-level too quickly</li>
                  <li>• Training when tired or distracted</li>
                  <li>• Focusing on speed over accuracy</li>
                  <li>• Getting frustrated with mistakes</li>
                  <li>• Irregular training schedule</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">📊 Progress Tracking</h3>
                <ul className="space-y-1 text-gray-700 text-sm">
                  <li>• Sessions are automatically saved</li>
                  <li>• Track accuracy trends over time</li>
                  <li>• Monitor response time improvements</li>
                  <li>• Celebrate N-level progressions</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg p-6">
              <h3 className="text-xl font-bold mb-2">Ready to Begin Your Journey?</h3>
              <p className="opacity-90">
                Remember: Improvement in working memory training is like physical fitness - it
                requires consistency and patience, but the results are worth it!
              </p>
            </div>
          </div>
        </div>
      ),
    },
  ]

  const currentStepData = steps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">N-Back Tutorial</h1>
          </div>
          <Badge variant="secondary" className="px-3 py-1">
            {currentStep + 1} of {steps.length}
          </Badge>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mb-8">
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentStep
                    ? 'bg-blue-600 scale-125'
                    : index < currentStep
                      ? 'bg-blue-300'
                      : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <Card className="shadow-xl mb-8">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <currentStepData.icon className="w-8 h-8 text-blue-600" />
              <CardTitle className="text-2xl">{currentStepData.title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-8">{currentStepData.content}</CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
            disabled={isFirstStep}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          {isLastStep ? (
            <Button
              size="lg"
              onClick={onComplete}
              className="bg-blue-600 hover:bg-blue-700 gap-2 px-8"
            >
              Start Training
              <Target className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
              className="gap-2"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export default Tutorial
