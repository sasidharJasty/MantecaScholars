import Navigation from '@/components/ui/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, ExternalLink } from 'lucide-react';
import Footer from '@/components/ui/footer';

const Donate = () => {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-b from-background via-accent/10 to-background">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div className="flex justify-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-hover rounded-full flex items-center justify-center">
                  <Heart className="w-8 h-8 text-primary-foreground" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary-hover bg-clip-text text-transparent mb-4">
                Support Manteca Scholars
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Your generous donations help us provide exceptional educational opportunities and support to our scholars.
              </p>
            </div>

            <Card className="shadow-xl border-border/50">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Make a Difference Today</CardTitle>
                <CardDescription>
                  Every donation, big or small, helps our students achieve their dreams
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-accent p-6 rounded-lg">
                  <h3 className="text-lg font-semibold text-primary mb-3">
                    Your Impact
                  </h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start">
                      <span className="text-accent-gold mr-2">✓</span>
                      <span>Provides scholarships for deserving students</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-accent-gold mr-2">✓</span>
                      <span>Funds educational programs and resources</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-accent-gold mr-2">✓</span>
                      <span>Supports mentorship and leadership development</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-accent-gold mr-2">✓</span>
                      <span>Creates opportunities for academic excellence</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-2">
                  <div className="rounded-xl border border-border/70 overflow-hidden bg-background">
                    <iframe
                      src="https://www.zeffy.com/en-US/donation-form/manteca-scholars--2026"
                      title="Donate to Manteca Scholars via Zeffy"
                      className="w-full h-[760px] md:h-[900px]"
                      loading="lazy"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    If the form does not load in your browser, use the secure link below.
                  </p>
                  <div className="text-center mt-3">
                    <Button size="sm" variant="outline" className="group" asChild>
                      <a
                        href="https://www.zeffy.com/en-US/donation-form/manteca-scholars--2026"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center"
                      >
                        Open Donation Form in New Tab
                        <ExternalLink className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </a>
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <p className="text-sm text-muted-foreground text-center">
                    Manteca Scholars is committed to transparency. For questions about donations,
                    please <a href="/contact" className="text-primary hover:text-primary-hover underline">contact us</a>.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="mt-8 text-center">
              <p className="text-muted-foreground italic">
                "Education is the most powerful weapon which you can use to change the world."
                <br />
                <span className="text-sm">— Nelson Mandela</span>
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Donate;
