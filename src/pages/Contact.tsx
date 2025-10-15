import Navigation from '@/components/ui/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, MapPin } from 'lucide-react';
import Footer from '@/components/ui/footer';

const Contact = () => {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-b from-background via-accent/10 to-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-bold text-primary mb-4">
                Contact Us
              </h1>
              <p className="text-lg text-muted-foreground">
                We're here to help. Reach out to us anytime.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Mail className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>Email</CardTitle>
                  <CardDescription>Send us an email anytime</CardDescription>
                </CardHeader>
                <CardContent>
                  <a
                    href="mailto:contact@mantecascholars.org"
                    className="text-primary hover:text-primary-hover text-lg font-medium transition-colors"
                  >
                    contact@mantecascholars.org
                  </a>
                </CardContent>
              </Card>

              <Card className="shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Phone className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle>Phone</CardTitle>
                  <CardDescription>Call us during business hours</CardDescription>
                </CardHeader>
                <CardContent>
                  <a
                    href="tel:+12095650034"
                    className="text-primary hover:text-primary-hover text-lg font-medium transition-colors"
                  >
                    +1 (209) 565-0034
                  </a>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-8 shadow-lg">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Location</CardTitle>
                <CardDescription>Find us in the heart of Manteca</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Manteca, California
                  <br />
                  Serving our community with excellence
                </p>
              </CardContent>
            </Card>

            <div className="mt-12 p-6 bg-accent rounded-lg border border-border">
              <h3 className="text-xl font-bold text-primary mb-2">Office Hours</h3>
              <p className="text-muted-foreground">
                Monday - Friday: 9:00 AM - 5:00 PM
                <br />
                Saturday - Sunday: Closed
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Contact;
