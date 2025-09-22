import { Facebook, Twitter, Instagram, Linkedin, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo and Mission */}
          <div className="space-y-4">
            <div className="text-2xl font-bold">
              Manteca <span className="text-accent-gold">Scholars</span>
            </div>
            <p className="text-primary-foreground/80 text-sm">
              Inspiring excellence and empowering students to be the best they can possibly be, 
              both in the classroom and in the community.
            </p>
            <div className="text-accent-gold font-medium italic">
              "Egredere et vince"
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Quick Links</h3>
            <div className="space-y-2 text-sm">
              <div><a href="/about" className="hover:text-accent-gold transition-colors">About Us</a></div>
              <div><a href="/programs" className="hover:text-accent-gold transition-colors">Our Programs</a></div>
              <div><a href="/team" className="hover:text-accent-gold transition-colors">Our Team</a></div>
              <div><a href="mailto:info@mantecascholars.org" className="hover:text-accent-gold transition-colors">Contact</a></div>
            </div>
          </div>

          {/* Social Media */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Connect With Us</h3>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="hover:text-accent-gold transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-6 w-6" />
              </a>
              <a 
                href="#" 
                className="hover:text-accent-gold transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-6 w-6" />
              </a>
              <a 
                href="#" 
                className="hover:text-accent-gold transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-6 w-6" />
              </a>
              <a 
                href="#" 
                className="hover:text-accent-gold transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-6 w-6" />
              </a>
              <a 
                href="mailto:info@mantecascholars.org" 
                className="hover:text-accent-gold transition-colors"
                aria-label="Email"
              >
                <Mail className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 text-center text-sm text-primary-foreground/60">
          <p>&copy; 2025 Manteca Scholars. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;