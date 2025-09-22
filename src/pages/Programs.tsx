import Navigation from "@/components/ui/navigation";
import Footer from "@/components/ui/footer";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

const Programs = () => {
  const programs = [
    { 
      name: "World Scholars Cup", 
      website: "https://www.worldscholarscup.org/",
      description: "An international academic program that brings together students from around the world to discuss and debate current issues."
    },
    { 
      name: "Speech and Debate", 
      website: "https://www.speechanddebate.org/",
      description: "Developing critical thinking and communication skills through competitive speech and debate tournaments."
    },
    { 
      name: "Mock Trial", 
      website: "https://www.constitutionalrights.org/",
      description: "Students learn about the legal system by participating in mock courtroom proceedings."
    },
    { 
      name: "Science Olympiad", 
      website: "https://www.soinc.org/",
      description: "Science competition that emphasizes hands-on learning and real-world problem solving."
    },
    { 
      name: "Quiz Bowl", 
      website: "https://www.naqt.com/",
      description: "Academic competition featuring questions from various subjects including literature, science, and history."
    },
    { 
      name: "Model UN", 
      website: "https://www.nmun.org/",
      description: "Students simulate United Nations committees to learn about diplomacy and international relations."
    },
    { 
      name: "Skills USA", 
      website: "https://www.skillsusa.org/",
      description: "Career and technical education organization helping students develop technical and leadership skills."
    },
    { 
      name: "UNICEF Club", 
      website: "https://www.unicefusa.org/",
      description: "Students advocate for children's rights and participate in humanitarian service projects."
    },
    { 
      name: "Women in STEM", 
      website: "https://www.womeninstem.org/",
      description: "Empowering young women to pursue careers in science, technology, engineering, and mathematics."
    },
    { 
      name: "Scholastic Art and Writing", 
      website: "https://www.artandwriting.org/",
      description: "Recognizing creative teenagers through the nation's longest-running writing and art competition."
    },
    { 
      name: "AMSA (American Medical Students Association)", 
      website: "https://www.amsa.org/",
      description: "Preparing students for careers in medicine through education and advocacy."
    },
    { 
      name: "Brain Bee", 
      website: "https://www.brainfacts.org/",
      description: "Neuroscience competition that motivates students to learn about the brain and neuroscience careers."
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-primary mb-4">Our Programs</h1>
          <div className="w-24 h-1 bg-accent-gold mx-auto mb-6"></div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Discover the diverse range of academic competitions and programs that help our students 
            develop critical thinking, leadership skills, and excellence in their chosen fields.
          </p>
        </div>

        {/* Programs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {programs.map((program, index) => (
            <Card key={index} className="h-full hover:shadow-lg transition-all duration-300 border-2 border-primary/10 hover:border-primary/30">
              <CardContent className="p-6 h-full flex flex-col">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-primary mb-3">{program.name}</h3>
                  <p className="text-muted-foreground mb-4 leading-relaxed">
                    {program.description}
                  </p>
                </div>
                <a 
                  href={program.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-accent-gold hover:text-primary transition-colors font-medium group"
                >
                  Visit Program Website
                  <ExternalLink className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Ready to Join a Program?</h2>
            <p className="text-lg mb-6">
              Each program offers unique opportunities for growth, learning, and competition. 
              Find the one that matches your interests and start your journey toward excellence.
            </p>
            <div className="text-accent-gold font-medium italic text-xl">
              "Egredere et vince" - Step forward and conquer
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Programs;