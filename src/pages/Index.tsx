import { Link } from "react-router-dom";
import Navigation from "@/components/ui/navigation";
import Footer from "@/components/ui/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Users, Trophy, ArrowRight, Star, Target } from "lucide-react";
import heroImage from "@/assets/hero-academic.jpg";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [programCount, setProgramCount] = useState<number>(12);

  useEffect(() => {
    const fetchProgramCount = async () => {
      const { count } = await supabase
        .from('programs')
        .select('*', { count: 'exact', head: true });
      
      // If we have a count, update state (subtracting System Admin if needed, 
      // but usually simple count is fine for marketing numbers)
      if (count !== null) {
        setProgramCount(count);
      }
    };
    fetchProgramCount();
  }, []);

  const newsItems = [
    {
      title: "World Scholars Cup Regional Competition Success",
      date: "March 15, 2025",
      excerpt: "Our students achieved outstanding results at the regional competition, with three teams advancing to globals."
    },
    {
      title: "Science Olympiad State Championship",
      date: "March 10, 2025", 
      excerpt: "Manteca Scholars teams placed in the top 10 in multiple events at the state championship."
    },
    {
      title: "Mock Trial District Victory",
      date: "March 5, 2025",
      excerpt: "Our mock trial team won the district championship and will represent our region at state level."
    }
  ];

  const highlights = [
    {
      icon: BookOpen,
      title: "Academic Excellence",
      description: `${programCount} different programs spanning science, debate, arts, and humanitarian work`
    },
    {
      icon: Users,
      title: "Strong Community",
      description: "Over 200 dedicated students and coordinators working toward shared goals"
    },
    {
      icon: Trophy,
      title: "Proven Results",
      description: "Consistent achievement in regional, state, and national competitions"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-primary/70"></div>
        </div>
        
        <div className="relative z-10 text-center text-primary-foreground max-w-4xl mx-auto px-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Manteca <span className="text-accent-gold">Scholars</span>
          </h1>
          <div className="text-2xl md:text-3xl font-medium mb-8 text-accent-gold italic">
            "Egredere et vince"
          </div>
          <p className="text-xl md:text-2xl mb-8 leading-relaxed">
            Inspiring excellence and empowering students to be the best they can possibly be, 
            both in the classroom and in the community.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild className="text-lg px-8 py-3">
              <Link to="/about">Learn More About Us</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8 py-3 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              <Link to="/programs">Explore Programs</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Quick Overview */}
      <section className="py-16 bg-accent/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary mb-4">Excellence in Every Endeavor</h2>
            <div className="w-24 h-1 bg-accent-gold mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {highlights.map((highlight, index) => (
              <Card key={index} className="text-center border-2 border-primary/10 hover:shadow-lg transition-shadow">
                <CardContent className="p-8">
                  <highlight.icon className="h-16 w-16 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-primary mb-3">{highlight.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{highlight.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Page Previews */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* About Us Preview */}
            <Card className="hover:shadow-lg transition-shadow border-2 border-primary/10">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <Target className="h-8 w-8 text-primary mr-3" />
                  <h3 className="text-2xl font-bold text-primary">About Us</h3>
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Founded in 2025, Manteca Scholars coordinates academic competitions and programs 
                  for Sierra High School. Learn about our mission, our founder's inspiring journey, 
                  and our commitment to excellence.
                </p>
                <Button variant="outline" asChild className="group">
                  <Link to="/about">
                    Read More
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Programs Preview */}
            <Card className="hover:shadow-lg transition-shadow border-2 border-primary/10">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <BookOpen className="h-8 w-8 text-primary mr-3" />
                  <h3 className="text-2xl font-bold text-primary">Our Programs</h3>
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Explore our diverse range of {programCount}+ academic programs including World Scholars Cup, 
                  Mock Trial, Science Olympiad, Model UN, and more. Find the perfect program 
                  to develop your talents.
                </p>
                <Button variant="outline" asChild className="group">
                  <Link to="/programs">
                    Read More
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Team Preview */}
            <Card className="hover:shadow-lg transition-shadow border-2 border-primary/10">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  <Users className="h-8 w-8 text-primary mr-3" />
                  <h3 className="text-2xl font-bold text-primary">Our Team</h3>
                </div>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  Meet our dedicated Board of Directors, Coordinators, and Executive Office Personnel 
                  who work tirelessly to support our students and maintain our high standards 
                  of excellence.
                </p>
                <Button variant="outline" asChild className="group">
                  <Link to="/team">
                    Read More
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Recent News */}
      <section className="py-16 bg-accent/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-primary mb-4">Recent News & Achievements</h2>
            <div className="w-24 h-1 bg-accent-gold mx-auto"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {newsItems.map((item, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow border-2 border-primary/10">
                <CardContent className="p-6">
                  <div className="flex items-center mb-3">
                    <Star className="h-5 w-5 text-accent-gold mr-2" />
                    <span className="text-sm text-muted-foreground">{item.date}</span>
                  </div>
                  <h3 className="text-lg font-bold text-primary mb-3">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.excerpt}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
