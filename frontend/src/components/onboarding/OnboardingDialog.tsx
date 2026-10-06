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
  ChevronRight, ChevronLeft, CheckCircle2, GraduationCap, Gavel, UserPlus, FolderOpen
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface OnboardingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role?: 'student' | 'admin_i' | 'admin_ii' | 'admin_iii' | 'team_leader' | 'guest';
}

interface OnboardingStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  illustration: React.ReactNode;
}

const OnboardingDialog = ({ open, onOpenChange, role = 'guest' }: OnboardingDialogProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { setOnboardingSeen } = useAuth();

  const handleComplete = async () => {
    await setOnboardingSeen();
    onOpenChange(false);
  };

  const getSteps = (): OnboardingStep[] => {
    // ADMIN STEPS (Admin I, II, III)
    if (role.startsWith('admin')) {
        const steps: OnboardingStep[] = [
            {
                title: 'Welcome, Administrator',
                description: 'You have administrative access to Manteca Scholars. This tour will guide you through your management tools.',
                icon: <Shield className="w-6 h-6" />,
                illustration: <div className="w-full h-40 bg-gradient-to-r from-slate-900 to-slate-800 rounded-xl flex items-center justify-center"><Shield className="w-12 h-12 text-white" /></div>
            },
            {
                title: 'Dashboard Overview',
                description: 'Your dashboard provides high-level stats: total active users, program counts, and pending actions requiring your attention.',
                icon: <FolderOpen className="w-6 h-6" />,
                illustration: (
                    <div className="w-full h-40 bg-muted/50 rounded-xl p-4 flex flex-col gap-2 justify-center">
                        <div className="flex gap-2">
                            <div className="flex-1 bg-card p-2 rounded shadow-sm border text-center">
                                <div className="text-xs text-muted-foreground">Users</div>
                                <div className="text-lg font-bold">120</div>
                            </div>
                            <div className="flex-1 bg-card p-2 rounded shadow-sm border text-center">
                                <div className="text-xs text-muted-foreground">Programs</div>
                                <div className="text-lg font-bold">8</div>
                            </div>
                        </div>
                    </div>
                )
            }
        ];

        if (role === 'admin_ii' || role === 'admin_iii') {
            steps.push({
                title: 'User Approvals',
                description: 'Critically important: Review new account signups in the "Approvals" section. You control who enters the platform.',
                icon: <UserPlus className="w-6 h-6" />,
                illustration: (
                     <div className="w-full h-40 bg-yellow-500/10 rounded-xl flex items-center justify-center p-4">
                        <div className="bg-card w-3/4 p-3 rounded shadow border">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-sm">Approvals</span>
                                <Badge variant="destructive">3 Pending</Badge>
                            </div>
                            <div className="space-y-1">
                                <div className="h-6 bg-muted rounded w-full"></div>
                                <div className="h-6 bg-muted rounded w-3/4"></div>
                            </div>
                        </div>
                     </div>
                )
            });
        }
        
        steps.push({
            title: 'Program Management',
            description: 'Create new programs, assign leaders, and oversee all activities from the "Programs" management interface.',
            icon: <Gavel className="w-6 h-6" />,
            illustration: <div className="w-full h-40 bg-primary/10 rounded-xl flex items-center justify-center"><Settings className="w-12 h-12 text-primary" /></div>
        });
        
        return steps;
    }

    // STUDENT / TEAM LEADER STEPS
    const baseSteps: OnboardingStep[] = [
      {
        title: 'Welcome to Your Dashboard',
        description: 'This is your central hub for all program activities. View your enrolled programs, upcoming events, and announcements.',
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
        description: 'Use the "Manage" button or the Compass icon in the sidebar to browse and join academic programs.',
        icon: <FolderOpen className="w-6 h-6" />,
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
              </div>
            </div>
          </div>
        )
      },
      {
        title: 'Chat & Collaboration',
        description: 'Each program has a secure workspace with a group chat, information board, and event schedule.',
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
                  <div className="bg-muted rounded-lg px-2 py-1 text-xs">Meeting tomorrow!</div>
                </div>
              </div>
            </div>
          </div>
        )
      }
    ];

    if (role === 'team_leader') {
      baseSteps.push({
        title: 'Team Leader Tools',
        description: 'As a leader, you can moderate chat messages, schedule events, and edit program information.',
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
                  <Calendar className="w-3 h-3 text-primary" />
                  Add Event
                </div>
                <div className="h-10 bg-accent rounded flex items-center justify-center gap-1 text-xs">
                  <Settings className="w-3 h-3 text-primary" />
                  Edit Info
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
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
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
