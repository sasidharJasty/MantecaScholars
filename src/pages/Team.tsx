import { useState } from 'react';
import Navigation from '@/components/ui/navigation';
import Footer from '@/components/ui/footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Mail, ChevronDown, ChevronUp, Sparkles, Monitor, Code } from 'lucide-react';

interface TeamMember {
  name: string;
  title: string;
  roles?: string[];
  email?: string;
}

const TeamMemberCard = ({ member }: { member: TeamMember }) => {
  const isCreator = member.name === 'Sasidhar Jasty';

  return (
    <div className="relative group hover:z-50 h-full">
        <Card className="h-full backdrop-blur-sm bg-card/80 border-primary/10 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 overflow-visible relative">
        <CardHeader className="pb-2">
            <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full transition-colors flex items-center justify-center bg-gradient-to-br from-primary to-primary/60 text-primary-foreground`}>
                {isCreator ? <Code className="w-6 h-6" /> : <User className="w-6 h-6" />}
            </div>
            <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                {member.name}
                {isCreator && (
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal tracking-wide bg-primary/10 text-primary hover:bg-primary/20">
                        Dev
                    </Badge>
                )}
                </CardTitle>
                <p className="text-sm font-medium text-primary">
                {member.title}
                </p>
            </div>
            </div>
        </CardHeader>
        <CardContent>
            {member.email && (
            <div className="my-2">
                <a
                href={`mailto:${member.email}`}
                className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                <Mail className="w-4 h-4" />
                {member.email}
                </a>
            </div>
            )}

            {/* Roles: Absolute positioned to avoid layout shift */}
            {member.roles && member.roles.length > 0 && (
            <div className="absolute left-0 right-0 top-[95%] pt-2 px-0 z-20 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto">
                <div className="bg-popover border border-primary/10 shadow-lg rounded-b-lg p-4 -mt-1 mx-[-1px]">
                    <div className="space-y-2">
                        {member.roles.map((role, idx) => (
                        <p key={idx} className="text-sm text-foreground bg-accent/50 p-2 rounded text-[13px] border-l-2 border-primary/30">
                            {role}
                        </p>
                        ))}
                    </div>
                </div>
            </div>
            )}
        </CardContent>
        </Card>
    </div>
  );
};

const Team = () => {
  const [showMoreUndersecretary, setShowMoreUndersecretary] = useState(false);

  const boardMembers: TeamMember[] = [
    {
      name: 'Miles Lima',
      title: 'Founder, President and Director of Programs',
      roles: ['Program Coordinator: World Scholars Cup']
    },
    {
      name: 'Shaurya Khairmode',
      title: 'Director-General',
      roles: ['Program Coordinator: MS Clash']
    },
    {
      name: 'Aditi Malgunde',
      title: 'Director of Records and Archives',
      roles: ['Program Coordinator: American Medical Students Association and Women in STEM']
    },
    {
      name: 'Isabel Aquinde',
      title: 'Co-Director of the Brand',
      roles: ['Program Coordinator: Model UN']
    },
    {
      name: 'Charlene Trinh',
      title: 'Co-Director of the Brand'
    },
    {
      name: 'Sagar Shah',
      title: 'Director of Finance and Asset Management'
    },
    {
      name: 'Nikitha Muruganagarajan',
      title: 'Chief Advisor to the President; Director of Fundraising',
      roles: ['Program Coordinator: Skills USA, Science Olympiad and Quiz Bowl']
    },
    {
      name: 'Kaushik Chamchani',
      title: 'Board Support Officer',
      roles: ['Program Coordinator: MS Math']
    }
  ];

  const programCoordinators: TeamMember[] = [
    {
      name: 'Calypso Culbertson',
      title: 'Program Coordinator for Mock Trial'
    },
    {
      name: 'Snehal Bhaira',
      title: 'Program Coordinator for Scholastic Art and Writing'
    }
  ];

  const undersecretariat: TeamMember[] = [
    {
      name: 'Sasidhar Jasty',
      title: 'Sr. Undersecretary for Information Technology'
    },
    {
      name: 'Sai Nellutla',
      title: 'Sr. Undersecretary for Student Discipline',
      roles: ['Program Coordinator for Speech and Debate']
    },
    {
      name: 'Abhimanyu Nair',
      title: 'Sr. Undersecretary for Grants and Sponsorships'
    },
    {
      name: 'Harshith Kumar',
      title: 'Sr. Undersecretary for Parent and Family Coordination'
    },
    {
      name: 'Christina Addis',
      title: 'Sr. Undersecretary for Events'
    },
    {
      name: 'Nessa Jerald',
      title: 'Sr. Undersecretary for Community Affairs'
    },
    
    {
      name: 'Raunak Mahar',
      title: 'Sr. Undersecretary for Student Development'
    }
  ];

  const undersecretariatHidden: TeamMember[] = [
    {
      name: 'Prithik Karthikeyan Manopriya',
      title: 'Sr. Undersecretary for Internal Affairs'
    }
  ];

  const undersecretariatWithSahithi: TeamMember[] = [
    {
      name: 'Sahithi Kamma',
      title: 'Sr. Undersecretary for Social Media; Administrative Support Officer'
    }
  ];

  const administrativeSupport: TeamMember[] = [
    {
      name: 'Tammana Grewal',
      title: 'Executive Assistant'
    },
    {
      name: 'Anjana Barath',
      title: 'Administrative Support Officer'
    },
    {
      name: 'Saanvi Srivastava',
      title: 'Administrative Support Officer'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <Navigation />

      <main className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent mb-4">
            Our Team
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Meet the dedicated individuals who make Manteca Scholars possible. Our team works tirelessly to empower students through academic competition.
          </p>
        </div>

        {/* Board of Directors */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
            <div className="h-8 w-1 bg-gradient-to-b from-primary to-primary/40 rounded-full"></div>
            Board of Directors and Coordinators
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {boardMembers.map((member, idx) => (
              <TeamMemberCard key={idx} member={member} />
            ))}
          </div>
        </section>

        {/* Program Coordinators */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
            <div className="h-8 w-1 bg-gradient-to-b from-primary to-primary/40 rounded-full"></div>
            Program Coordinators
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {programCoordinators.map((member, idx) => (
              <TeamMemberCard key={idx} member={member} />
            ))}
          </div>
        </section>

        {/* Undersecretariat */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
            <div className="h-8 w-1 bg-gradient-to-b from-primary to-primary/40 rounded-full"></div>
            Undersecretariat
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {undersecretariat.map((member, idx) => (
              <TeamMemberCard key={idx} member={member} />
            ))}
            {undersecretariatWithSahithi.map((member, idx) => (
              <TeamMemberCard key={idx} member={member} />
            ))}
            {showMoreUndersecretary && undersecretariatHidden.map((member, idx) => (
              <TeamMemberCard key={idx} member={member} />
            ))}
          </div>
          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={() => setShowMoreUndersecretary(!showMoreUndersecretary)}
              className="text-primary"
            >
              {showMoreUndersecretary ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-2" />
                  Show Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-2" />
                  Show More
                </>
              )}
            </Button>
          </div>
        </section>

        {/* Administrative Support */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-8 flex items-center gap-3">
            <div className="h-8 w-1 bg-gradient-to-b from-primary to-primary/40 rounded-full"></div>
            Administrative Support
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {administrativeSupport.map((member, idx) => (
              <TeamMemberCard key={idx} member={member} />
            ))}
          </div>
        </section>

        {/* Join CTA */}
        <section className="text-center py-16 bg-gradient-to-r from-primary/10 to-primary/5 rounded-3xl">
          <h2 className="text-3xl font-bold mb-4">Join Our Mission</h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            We're always looking for passionate individuals to help guide our scholars to success. 
            Whether as a mentor, volunteer, or supporter, your contribution makes a difference.
          </p>
          <Button size="lg" className="bg-primary hover:bg-primary/90" asChild>
            <a href="/contact">Get Involved</a>
          </Button>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Team;
