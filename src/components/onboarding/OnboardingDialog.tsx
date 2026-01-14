import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, MessageCircle, Calendar, Bell, Shield, Settings, 
  ChevronRight, ChevronLeft, CheckCircle2, GraduationCap
} from 'lucide-react';

interface OnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: 'student' | 'admin_i' | 'admin_ii' | 'admin_iii' | 'team_leader';
}

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  illustration: React.ReactNode;
}

const OnboardingDialog = ({ open, onOpenChange, role }: OnboardingDialogProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const getSteps = (): OnboardingStep[] => {
    const baseSteps: OnboardingStep[] = [
      {
        title: 'Welcome to Your Dashboard',
        description: 'This is your central hub for all program activities. Here you can view your enrolled programs, upcoming events, and important announcements.',
        icon: <GraduationCap className="w-6 h-6" />,
        illustration: (
          <div className="w-full h-40 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl flex items-center justify-center">
            <div className="grid grid-cols-3 gap-3 p-4">
              <div className="w-16 h-12 bg-card rounded-lg shadow-sm border flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <div className="w-16 h-12 bg-card rounded-lg shadow-sm border flex items-center justify-center">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div className="w-16 h-12 bg-card rounded-lg shadow-sm border flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
            </div>
          </div>
        )
      },
      {
        title: 'Program Selection',
        description: 'Use the "Manage" button in your Programs section to join or leave academic programs. Your selections are saved automatically.',
        icon: <Settings className="w-6 h-6" />,
        illustration: (
          <div className="w-full h-40 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl flex items-center justify-center p-4">
            <div className="bg-card rounded-lg shadow-lg border p-4 w-full max-w-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">My Programs</span>
                <Button size="sm" variant="ghost" className="h-6 text-xs">
                  <Settings className="w-3 h-3 mr-1" />
                  Manage
                </Button>
              </div>
              <div className="space-y-2">
                <div className="h-8 bg-accent rounded flex items-center px-2">
                  <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                  <span className="text-xs">Science Olympiad</span>
                </div>
                <div className="h-8 bg-accent rounded flex items-center px-2">
                  <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                  <span className="text-xs">Mock Trial</span>
                </div>
              </div>
            </div>
          </div>
        )
      },
      {
        title: 'Stay Connected with Chat',
        description: 'Each program has a group chat where you can communicate with other members and program leaders. Use it to ask questions and stay updated!',
        icon: <MessageCircle className="w-6 h-6" />,
        illustration: (
          <div className="w-full h-40 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl flex items-center justify-center p-4">
            <div className="bg-card rounded-lg shadow-lg border p-3 w-full max-w-xs">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                <MessageCircle className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Program Chat</span>
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs">M</div>
                  <div className="bg-muted rounded-lg px-2 py-1 text-xs">Meeting tomorrow at 3pm!</div>
                </div>
                <div className="flex gap-2 flex-row-reverse">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs text-white">Y</div>
                  <div className="bg-primary text-primary-foreground rounded-lg px-2 py-1 text-xs">Thanks for the update!</div>
                </div>
              </div>
            </div>
          </div>
        )
      }
    ];

    if (role === 'team_leader' || role === 'admin_i' || role === 'admin_ii' || role === 'admin_iii') {
      baseSteps.push({
        title: 'Moderation Tools',
        description: 'As a leader, you can moderate chat messages, pin important announcements, and manage your program members from the roster.',
        icon: <Shield className="w-6 h-6" />,
        illustration: (
          <div className="w-full h-40 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl flex items-center justify-center p-4">
            <div className="bg-card rounded-lg shadow-lg border p-3 w-full max-w-xs">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Moderator Actions</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="h-10 bg-accent rounded flex items-center justify-center gap-1 text-xs">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  Pin Message
                </div>
                <div className="h-10 bg-accent rounded flex items-center justify-center gap-1 text-xs">
                  <Users className="w-3 h-3 text-primary" />
                  View Roster
                </div>
              </div>
            </div>
          </div>
        )
      });
    }

    if (role === 'admin_ii' || role === 'admin_iii') {
      baseSteps.push({
        title: 'User Approvals',
        description: 'Review and approve new user registrations. Navigate to the Approvals section to manage pending accounts.',
        icon: <Users className="w-6 h-6" />,
        illustration: (
          <div className="w-full h-40 bg-gradient-to-br from-yellow-500/20 to-yellow-500/5 rounded-xl flex items-center justify-center p-4">
            <div className="bg-card rounded-lg shadow-lg border p-3 w-full max-w-xs">
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-yellow-500/10 text-yellow-600 text-xs">3 Pending</Badge>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between bg-accent rounded px-2 py-1">
                  <span className="text-xs">John Doe</span>
                  <div className="flex gap-1">
                    <div className="w-5 h-5 bg-green-500/20 rounded flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-green-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      });
    }

    return baseSteps;
  };

  const steps = getSteps();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onOpenChange(false);
      localStorage.setItem('onboarding_completed', 'true');
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
    localStorage.setItem('onboarding_completed', 'true');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              {steps[currentStep]?.icon}
            </div>
            <Badge variant="outline" className="text-xs">
              Step {currentStep + 1} of {steps.length}
            </Badge>
          </div>
          <DialogTitle>{steps[currentStep]?.title}</DialogTitle>
          <DialogDescription>
            {steps[currentStep]?.description}
          </DialogDescription>
        </DialogHeader>

        <div className="my-4">
          {steps[currentStep]?.illustration}
        </div>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mb-4">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentStep 
                  ? 'w-6 bg-primary' 
                  : idx < currentStep 
                    ? 'w-1.5 bg-primary/60' 
                    : 'w-1.5 bg-muted'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={handleSkip} size="sm">
            Skip Tour
          </Button>
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrev} size="sm">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
            <Button onClick={handleNext} size="sm">
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
              {currentStep < steps.length - 1 && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingDialog;
