import Navigation from "@/components/ui/navigation";
import Footer from "@/components/ui/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, User } from "lucide-react";

const Team = () => {
  const boardMembers = [
    {
      name: "Miles Lima",
      title: "Founder, Chairman and Director of the Program",
      role: "Coordinator for World Scholars Cup",
      email: "mlima@mantecascholars.org"
    },
    {
      name: "Colin Nguyen",
      title: "Director-General",
      role: "",
      email: "cnguyen@mantecascholars.org"
    },
    {
      name: "Aditi Malgunde",
      title: "Director of Records and Archives",
      role: "Coordinator for Women in STEM and AMSA",
      email: "amalgunde@mantecascholars.org"
    },
    {
      name: "Kaushik Chamchani",
      title: "Director of Finance and Assets",
      role: "",
      email: "kchamchani@mantecascholars.org"
    },
    {
      name: "Charlene Trinh",
      title: "Co-Director of the Brand",
      role: "",
      email: "ctrinh@mantecascholars.org"
    },
    {
      name: "Isabel Aquinde",
      title: "Co-Director of the Brand",
      role: "Coordinator for Model UN",
      email: "iaquinde@mantecascholars.org"
    },
    {
      name: "Nikitha Muruganagarajan",
      title: "Director of Fundraising",
      role: "Coordinator for Science Olympiad, Quiz Bowl, Skills USA, and Brain Bee",
      email: "nmuruganagarajan@mantecascholars.org"
    },
    {
      name: "Aaron Monasterio",
      title: "Coordinator for Speech and Debate",
      role: "",
      email: "amonasterio@mantecascholars.org"
    },
    {
      name: "Calypso Culbertson",
      title: "Coordinator for Mock Trial",
      role: "",
      email: "cculbertson@mantecascholars.org"
    },
    {
      name: "Nessa Jerald",
      title: "Coordinator for UNICEF Club",
      role: "",
      email: "njerald@mantecascholars.org"
    },
    {
      name: "Snehal Bhaira",
      title: "Coordinator for Scholastic Art and Writing",
      role: "",
      email: "sbhaira@mantecascholars.org"
    }
  ];

  const executivePersonnel = [
    {
      name: "Tammana Grewal",
      title: "Chief of Staff",
      email: "tgrewal@mantecascholars.org"
    },
    {
      name: "Shaurya Khairmode",
      title: "Sr. Undersecretary for Parent and Family Coordination",
      email: "skhairmode@mantecascholars.org"
    },
    {
      name: "Sai Nellutla",
      title: "Sr. Undersecretary for Student Discipline",
      email: "snellutla@mantecascholars.org"
    },
    {
      name: "Christina Addis",
      title: "Sr. Undersecretary for Local Events",
      email: "caddis@mantecascholars.org"
    },
    {
      name: "Sasidhar Jasty",
      title: "Sr. Undersecretary for Information Technology",
      email: "sjasty@mantecascholars.org"
    },
    {
      name: "Harshith Kumar",
      title: "Sr. Undersecretary for Student Development",
      email: "hkumar@mantecascholars.org"
    },
    {
      name: "Abhimanyu Nair",
      title: "Sr. Undersecretary for Corporate Relations",
      email: "anair@mantecascholars.org"
    },
    {
      name: "Sahithi Kamma",
      title: "Sr. Undersecretary for Social Media, Administrative Support Officer",
      email: "skamma@mantecascholars.org"
    },
    {
      name: "Anjana Barath",
      title: "Administrative Support Officer",
      email: "abarath@mantecascholars.org"
    },
    {
      name: "Saanvi Srivistava",
      title: "Administrative Support Officer",
      email: "ssrivistava@mantecascholars.org"
    }
  ];

  const TeamMemberCard = ({ member }: { member: any }) => (
    <Card className="h-full hover:shadow-lg transition-shadow border-2 border-primary/10">
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-hover rounded-full flex items-center justify-center mr-4">
            <User className="h-8 w-8 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-primary">{member.name}</h3>
            <p className="text-sm font-medium text-accent-gold">{member.title}</p>
            {member.role && (
              <p className="text-xs text-muted-foreground mt-1">{member.role}</p>
            )}
          </div>
        </div>
        <a 
          href={`mailto:${member.email}`}
          className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors text-sm"
        >
          <Mail className="h-4 w-4 mr-2" />
          {member.email}
        </a>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-primary mb-4">Our Team</h1>
          <div className="w-24 h-1 bg-accent-gold mx-auto mb-6"></div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Meet the dedicated individuals who make Manteca Scholars possible. Our team of passionate 
            educators and coordinators work together to inspire excellence in every student.
          </p>
        </div>

        {/* Board of Directors and Coordinators */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-primary mb-8">Board of Directors and Coordinators</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {boardMembers.map((member, index) => (
              <TeamMemberCard key={index} member={member} />
            ))}
          </div>
        </div>

        {/* Executive Office Personnel */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-primary mb-8">Executive Office Personnel</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {executivePersonnel.map((member, index) => (
              <TeamMemberCard key={index} member={member} />
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-primary to-primary-hover text-primary-foreground rounded-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Join Our Mission</h2>
            <p className="text-lg mb-6">
              Interested in becoming part of our team? We're always looking for passionate individuals 
              who share our commitment to academic excellence and student development.
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

export default Team;