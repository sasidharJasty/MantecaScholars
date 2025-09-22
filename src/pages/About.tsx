import Navigation from "@/components/ui/navigation";
import Footer from "@/components/ui/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Target, Heart } from "lucide-react";

const About = () => {
  const programs = [
    { name: "World Scholars Cup", website: "https://www.worldscholarscup.org/" },
    { name: "Speech and Debate", website: "https://www.speechanddebate.org/" },
    { name: "Mock Trial", website: "https://www.constitutionalrights.org/" },
    { name: "Science Olympiad", website: "https://www.soinc.org/" },
    { name: "Quiz Bowl", website: "https://www.naqt.com/" },
    { name: "Model UN", website: "https://www.nmun.org/" },
    { name: "Skills USA", website: "https://www.skillsusa.org/" },
    { name: "UNICEF Club", website: "https://www.unicefusa.org/" },
    { name: "Women in STEM", website: "https://www.womeninstem.org/" },
    { name: "Scholastic Art and Writing", website: "https://www.artandwriting.org/" },
    { name: "AMSA (American Medical Students Association)", website: "https://www.amsa.org/" },
    { name: "Brain Bee", website: "https://www.brainfacts.org/" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-primary mb-4">About Manteca Scholars</h1>
          <div className="w-24 h-1 bg-accent-gold mx-auto"></div>
        </div>

        {/* Organization Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border-2 border-primary/10 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-primary mb-2">Excellence</h3>
              <p className="text-muted-foreground">We inspire excellence above all else through academic competitions and programs.</p>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-primary/10 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <Target className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-primary mb-2">Leadership</h3>
              <p className="text-muted-foreground">Creating great leaders and thinkers through competitive yet supportive environments.</p>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-primary/10 hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <Heart className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-primary mb-2">Community</h3>
              <p className="text-muted-foreground">Developing critical thinking, integrity, and accountability in our students.</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="prose prose-lg max-w-none">
          <div className="bg-accent/30 rounded-lg p-8 mb-12">
            <p className="text-foreground leading-relaxed mb-6">
              Manteca Scholars is a non-profit organization that aims to inspire excellence, above all else. 
              Our organization coordinates, facilitates and oversees academic competitions, programs and events 
              for Sierra High School, situated in the San Joaquin Valley of northern California. Founded in 2025 
              by then sophomore, Miles Lima, our goal is to create great leaders and thinkers, working to students' 
              individual strengths and developing key skills such as critical thinking, integrity and accountability, 
              and logical decision making, all in a competitive, yet supportive environment.
            </p>
          </div>

          {/* Mission Statement */}
          <div className="bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-lg p-8 mb-12">
            <h2 className="text-2xl font-bold mb-4 text-center">Mission Statement</h2>
            <p className="text-center text-lg italic">
              The mission of Manteca Scholars is to inspire and empower students to be the best they can possibly be, 
              both in the classroom and in the community.
            </p>
          </div>

          {/* About the Founder */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-primary mb-6">About the Founder</h2>
            <div className="bg-card border border-border rounded-lg p-8">
              <p className="text-foreground leading-relaxed mb-4">
                Miles Lima was first diagnosed with Retinoblastoma, a rare cancer of the eyes, at just two months old. 
                That was the beginning of a long and arduous journey, on which he experienced chemotherapy, numerous rounds 
                of radiation, and countless invasive surgeries. Miles was declared cancer-free at age 2, but a year later, 
                it returned, and worse than before.
              </p>
              <p className="text-foreground leading-relaxed mb-4">
                When Miles was four, he underwent an experimental procedure to attempt to neutralize the tumors. The treatment 
                was successful in that aim, yet there were life-altering side-affects, the most damning of which was the slow 
                decay of Miles's vision. Over the next seven years, his sight deteriorated, before, in April of 2019, he was 
                again diagnosed with cancer. Five months of intensive chemotherapy later, his right eye was permanently removed 
                to access the site of the new tumor. Miles was finally pronounced in remission in September 2019.
              </p>
              <p className="text-foreground leading-relaxed mb-4">
                His journey, however, was not yet over. Miles had his left eye removed a year later, in order to mitigate 
                near-constant pain.
              </p>
              <p className="text-foreground leading-relaxed">
                Despite his hardship, Miles has managed to excel academically. He maintains a 4.25 GPA, plays keyboards 
                and sings for several local bands, and even directs a choir. Miles founded Manteca Scholars in order to use 
                his experiences surmounting hardship to inspire others to do the same. He currently attends Sierra High School, 
                with hopes of attending university in New Zealand, to pursue a career in international relations.
              </p>
            </div>
          </div>

          {/* Our Programs */}
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-primary mb-8 text-center">Our Programs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {programs.map((program, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow border-2 border-primary/10">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-primary mb-3">{program.name}</h3>
                    <a 
                      href={program.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-accent-gold hover:text-primary transition-colors font-medium"
                    >
                      Visit Program Website →
                    </a>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;