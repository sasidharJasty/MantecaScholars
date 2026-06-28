import { useState } from "react";
import Navigation from "@/components/ui/navigation";
import Footer from "@/components/ui/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  MessageSquare,
  PenTool,
  Target,
  Users,
  CheckCircle2,
  ArrowRight,
  Info,
  DollarSign,
  Loader2,
} from "lucide-react";

const WorldScholarsCoaching = () => {
  const { profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (data: FormData) => {
    const newErrors: Record<string, string> = {};

    const email = data.get("email") as string;
    if (!email) {
      newErrors.email = "We need your email to follow up with you";
    } else if (!email.includes("@")) {
      newErrors.email = "Please include an '@' in your email address";
    }

    const firstName = data.get("first_name") as string;
    if (!firstName) newErrors.first_name = "Please tell us your first name";

    const lastName = data.get("last_name") as string;
    if (!lastName) newErrors.last_name = "Please tell us your last name";

    const school = data.get("school") as string;
    if (!school) newErrors.school = "Which school do you attend?";

    const city = data.get("city") as string;
    if (!city) newErrors.city = "Please provide your city";

    const country = data.get("country") as string;
    if (!country) newErrors.country = "Please provide your country";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);

    if (!validate(formData)) {
      setIsSubmitting(false);
      toast.error("Please correct the errors in the form");
      return;
    }

    // Append User Metadata
    if (profile) {
      formData.append("user_id", profile.id);
      formData.append("user_email", profile.email);
      formData.append("user_role", profile.role);
      if (profile.member_id) formData.append("member_id", profile.member_id);
    } else {
      formData.append("user_status", "guest");
    }

    // Append Technical Metadata
    formData.append("user_agent", navigator.userAgent);
    formData.append("page_url", window.location.href);
    formData.append("submission_time", new Date().toISOString());
    formData.append(
      "screen_resolution",
      `${window.screen.width}x${window.screen.height}`,
    );
    formData.append(
      "timezone",
      Intl.DateTimeFormat().resolvedOptions().timeZone,
    );

    try {
      const response = await fetch(
        "https://formsubmit.co/ajax/mlima@mantecascholars.org",
        {
          method: "POST",
          body: formData,
        },
      );

      if (response.ok) {
        toast.success("Interest form submitted successfully!");
        (e.target as HTMLFormElement).reset();
        setErrors({});
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } catch (error) {
      toast.error("An error occurred while submitting the form.");
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background">
      <Navigation />

      <main className="container mx-auto px-4 py-12 lg:py-20">
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-24 items-center">
          <div className="lg:col-span-2 space-y-6">
            <Badge
              variant="outline"
              className="text-primary border-primary/30 px-3 py-1"
            >
              World Scholars Coaching
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
              World Scholar's Cup <br />
              <span className="bg-gradient-to-r from-primary via-primary to-primary/60 bg-clip-text text-transparent">
                coaching with Miles Lima.
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Miles Lima, the 2025 1st place individual world champion, and
              select Manteca Scholars staff are offering private and group
              coaching for students preparing for the World Scholar's Cup.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90"
                asChild
              >
                <a href="#apply">
                  Submit interest form <ArrowRight className="ml-2 w-4 h-4" />
                </a>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary/20 hover:bg-primary/5"
                asChild
              >
                <a href="#program">See what is included</a>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8">
              {[
                { title: "Individual", desc: "Focused one-on-one support" },
                { title: "Group", desc: "Coaching for teams or cohorts" },
                {
                  title: "WSC-specific",
                  desc: "Built around the actual events",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 rounded-xl bg-card/50 border border-primary/10 backdrop-blur-sm"
                >
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="font-semibold text-foreground">
                      {item.title}
                    </p>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="lg:col-span-1">
            <Card className="relative overflow-hidden border-primary/20 bg-card/80 backdrop-blur-md shadow-xl shadow-primary/5">
              <div className="absolute top-0 right-0 p-4">
                <DollarSign className="w-6 h-6 text-primary/20" />
              </div>
              <CardHeader>
                <CardTitle className="text-2xl mb-2">
                  Interest is open now.
                </CardTitle>
                <p className="text-muted-foreground text-sm">
                  Students may join as individuals, small groups, school teams,
                  or cohorts. Proceeds support nonprofit work to bring WSC to
                  more students and expand access.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <span className="text-sm font-medium text-primary">
                    Standard Fee
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    $1,250
                  </span>
                </div>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <Info className="w-4 h-4 shrink-0" />
                  <p>
                    Default fee: $1,250 per student. Adjusted pricing may be
                    available based on location. Fees help fund nonprofit
                    expansion of WSC opportunities.
                  </p>
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>

        {/* Who It Is For */}
        <section id="fit" className="mb-24 scroll-mt-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              <Badge
                variant="outline"
                className="text-primary border-primary/30 px-3 py-1"
              >
                Who It Is For
              </Badge>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                Clear WSC preparation from proven competitors.
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Coaching focuses on the actual World Scholar's Cup events:
                debate, collaborative writing, challenge preparation, team
                strategy, and tournament confidence.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                {
                  icon: MessageSquare,
                  title: "Debate readiness",
                  desc: "Practice motions, rebuttals, speeches, and round strategy.",
                },
                {
                  icon: PenTool,
                  title: "Writing support",
                  desc: "Improve argument structure, evidence use, drafting, and revision.",
                },
                {
                  icon: Target,
                  title: "Challenge strategy",
                  desc: "Turn the syllabus into priorities, patterns, and a calmer test-day plan.",
                },
                {
                  icon: Users,
                  title: "Team coaching",
                  desc: "Clarify roles, prep routines, and how the team should work together.",
                },
              ].map((feature, i) => (
                <Card
                  key={i}
                  className="border-primary/10 hover:border-primary/30 transition-colors group"
                >
                  <CardContent className="pt-6">
                    <div className="p-2 w-fit rounded-lg bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <feature.icon className="w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.desc}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Coaching Options Comparison */}
        <section className="mb-24 space-y-12">
          <div className="text-center space-y-4">
            <Badge
              variant="outline"
              className="text-primary border-primary/30 px-3 py-1"
            >
              Choose Your Path
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              Tailored Coaching Formats
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Whether you are a solo competitor or a full school team, we have a
              format designed to maximize your potential.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: "Individual",
                subtitle: "Personalized Mastery",
                description:
                  "Focused one-on-one support designed for maximum individual growth.",
                features: [
                  "Customized learning pace",
                  "Direct feedback on specific weaknesses",
                  "High-intensity 1-on-1 sessions",
                  "Precision-targeted prep map",
                ],
                bestFor:
                  "Students aiming for top individual rankings or needing intensive support.",
                highlight: "Maximum Attention",
              },
              {
                title: "Group",
                subtitle: "Collaborative Growth",
                description:
                  "Coaching for teams or cohorts to build synergy and collective skill.",
                features: [
                  "Team-building and role alignment",
                  "Peer-to-peer learning and feedback",
                  "Shared strategic workshops",
                  "Coordinated team routines",
                ],
                bestFor:
                  "School teams, existing cohorts, or friends preparing together.",
                highlight: "Team Synergy",
              },
              {
                title: "WSC-Specific",
                subtitle: "Tactical Excellence",
                description:
                  "Specialized training focused entirely on the WSC tournament format.",
                features: [
                  "Pro-level motion analysis",
                  "Advanced writing templates",
                  "Syllabus priority mapping",
                  "Tournament-day confidence drills",
                ],
                bestFor:
                  "Students who have the basics but want 'pro' tactics for competition.",
                highlight: "Strategic Edge",
              },
            ].map((option, i) => (
              <Card
                key={i}
                className="border-primary/20 flex flex-col hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 group"
              >
                <CardHeader className="text-center space-y-4">
                  <Badge className="mx-auto bg-primary text-primary-foreground">
                    {option.highlight}
                  </Badge>
                  <CardTitle className="text-2xl font-bold">
                    {option.title}
                  </CardTitle>
                  <p className="font-medium text-primary">{option.subtitle}</p>
                </CardHeader>
                <CardContent className="flex-1 space-y-6">
                  <p className="text-sm text-muted-foreground text-center">
                    {option.description}
                  </p>
                  <div className="space-y-3">
                    {option.features.map((feature, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 text-sm text-foreground"
                      >
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/10 text-xs text-muted-foreground italic">
                    <strong className="text-foreground not-italic">
                      Best for:{" "}
                    </strong>
                    {option.bestFor}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Program Shape */}
        <section
          id="program"
          className="mb-24 py-16 px-8 rounded-3xl bg-primary/5 border border-primary/10 scroll-mt-20"
        >
          <div className="max-w-4xl mx-auto text-center space-y-6 mb-16">
            <Badge
              variant="outline"
              className="text-primary border-primary/30 px-3 py-1"
            >
              Program Shape
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              Simple structure. Practical sessions.
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The schedule is adapted to each student's competition timeline.
              The goal is to diagnose needs, train the right skills, and prepare
              efficiently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: "1",
                title: "Diagnostic session",
                desc: "Identify strengths, gaps, deadlines, and the highest-priority skills.",
              },
              {
                step: "2",
                title: "Targeted coaching",
                desc: "Work on the WSC events where coaching can create the biggest lift.",
              },
              {
                step: "3",
                title: "Competition plan",
                desc: "Leave with practice tasks, prep priorities, and a tournament plan.",
              },
            ].map((step, i) => (
              <div
                key={i}
                className="relative p-6 rounded-2xl bg-card border border-primary/10 shadow-sm group hover:shadow-md transition-shadow"
              >
                <div className="absolute -top-4 -left-4 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-lg">
                  {step.step}
                </div>
                <div className="mt-4 space-y-2">
                  <h3 className="font-bold text-lg text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Why This Exists */}
        <section className="mb-24 text-center max-w-3xl mx-auto space-y-6">
          <Badge
            variant="outline"
            className="text-primary border-primary/30 px-3 py-1"
          >
            Why This Exists
          </Badge>
          <h2 className="text-3xl font-bold text-foreground">
            Coaching that also helps the program grow.
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Manteca Scholars is offering this service as a nonprofit expansion
            effort. The goal is to help more students access serious WSC
            preparation while supporting broader outreach, programming, and
            growth.
          </p>
        </section>

        {/* What Is Included */}
        <section className="mb-24 space-y-12">
          <div className="text-center space-y-4">
            <Badge
              variant="outline"
              className="text-primary border-primary/30 px-3 py-1"
            >
              What Is Included
            </Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              What students get.
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Each student receives practical guidance they can use between
              sessions.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Personal prep map",
                desc: "A focused plan based on timeline, level, and current needs.",
              },
              {
                title: "Live skill sessions",
                desc: "Coaching for debate, writing, syllabus study, and tournament strategy.",
              },
              {
                title: "Practice feedback",
                desc: "Actionable notes on speeches, writing, study habits, or team prep.",
              },
              {
                title: "Team alignment",
                desc: "Support for teams that need roles, routines, and shared expectations.",
              },
              {
                title: "Parent clarity",
                desc: "Simple updates so families understand the next steps.",
              },
              {
                title: "Regional pricing review",
                desc: "Pricing can be reviewed based on location and local context.",
              },
            ].map((item, i) => (
              <Card
                key={i}
                className="border-primary/10 hover:bg-primary/5 transition-colors"
              >
                <CardContent className="pt-6 flex items-start gap-4">
                  <div className="p-1 rounded-full bg-primary/20 text-primary shrink-0">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Interest Form */}
        <section id="apply" className="mb-24 scroll-mt-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-card border border-primary/20 rounded-3xl p-8 lg:p-12 shadow-xl shadow-primary/5">
            <div className="space-y-6">
              <Badge
                variant="outline"
                className="text-primary border-primary/30 px-3 py-1"
              >
                Interest Form
              </Badge>
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
                Submit interest.
              </h2>
              <p className="text-xl text-muted-foreground">
                Share your details and we will follow up about format, schedule,
                and pricing.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit} noValidate>
              <input
                type="hidden"
                name="_subject"
                value="New Manteca Scholars WSC Coaching Interest Form"
              />
              <input type="hidden" name="_template" value="table" />
              <input type="hidden" name="_captcha" value="false" />
              <input
                type="hidden"
                name="_autoresponse"
                value="Thank you for submitting interest in Manteca Scholars World Scholar's Cup coaching. We received your information and will follow up about coaching format, schedule, and location-based pricing as soon as possible."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 relative">
                  <Label htmlFor="first_name">First name</Label>
                  <Input
                    id="first_name"
                    name="first_name"
                    autoComplete="given-name"
                    className={`border-gray-200 border-2 transition-colors ${errors.first_name ? "border-red-600 ring-red-600" : ""}`}
                  />
                  {errors.first_name && (
                    <div className="absolute left-0 top-full mt-1 px-2 py-1 bg-red-600 text-white text-[10px] rounded-b-md rounded-tr-md z-50 whitespace-nowrap shadow-sm animate-in fade-in slide-in-from-top-1">
                      {errors.first_name}
                    </div>
                  )}
                </div>
                <div className="space-y-2 relative">
                  <Label htmlFor="last_name">Last name</Label>
                  <Input
                    id="last_name"
                    name="last_name"
                    autoComplete="family-name"
                    className={`border-gray-200 border-2 transition-colors ${errors.last_name ? "border-red-600 ring-red-600" : ""}`}
                  />
                  {errors.last_name && (
                    <div className="absolute left-0 top-full mt-1 px-2 py-1 bg-red-600 text-white text-[10px] rounded-b-md rounded-tr-md z-50 whitespace-nowrap shadow-sm animate-in fade-in slide-in-from-top-1">
                      {errors.last_name}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  className={`border-gray-200 border-2 transition-colors ${errors.email ? "border-red-600 ring-red-600" : ""}`}
                />
                {errors.email && (
                  <div className="absolute left-0 top-full mt-1 px-2 py-1 bg-red-600 text-white text-[10px] rounded-b-md rounded-tr-md z-50 whitespace-nowrap shadow-sm animate-in fade-in slide-in-from-top-1">
                    {errors.email}
                  </div>
                )}
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="school">School name</Label>
                <Input
                  id="school"
                  name="school"
                  autoComplete="organization"
                  className={`border-gray-200 border-2 transition-colors ${errors.school ? "border-red-600 ring-red-600" : ""}`}
                />
                {errors.school && (
                  <div className="absolute left-0 top-full mt-1 px-2 py-1 bg-red-600 text-white text-[10px] rounded-b-md rounded-tr-md z-50 whitespace-nowrap shadow-sm animate-in fade-in slide-in-from-top-1">
                    {errors.school}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 relative">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    autoComplete="address-level2"
                    className={`border-gray-200 border-2 transition-colors ${errors.city ? "border-red-600 ring-red-600" : ""}`}
                  />
                  {errors.city && (
                    <div className="absolute left-0 top-full mt-1 px-2 py-1 bg-red-600 text-white text-[10px] rounded-b-md rounded-tr-md z-50 whitespace-nowrap shadow-sm animate-in fade-in slide-in-from-top-1">
                      {errors.city}
                    </div>
                  )}
                </div>
                <div className="space-y-2 relative">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    name="country"
                    autoComplete="country-name"
                    className={`border-gray-200 border-2 transition-colors ${errors.country ? "border-red-600 ring-red-600" : ""}`}
                  />
                  {errors.country && (
                    <div className="absolute left-0 top-full mt-1 px-2 py-1 bg-red-600 text-white text-[10px] rounded-b-md rounded-tr-md z-50 whitespace-nowrap shadow-sm animate-in fade-in slide-in-from-top-1">
                      {errors.country}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="instagram">
                    Instagram handle{" "}
                    <span className="text-muted-foreground font-normal text-xs italic">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id="instagram"
                    name="instagram"
                    placeholder="@username"
                    className=" border-gray-200 border-2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">
                    WhatsApp number{" "}
                    <span className="text-muted-foreground font-normal text-xs italic">
                      (optional)
                    </span>
                  </Label>
                  <Input
                    id="whatsapp"
                    type="tel"
                    name="whatsapp"
                    className=" border-gray-200 border-2"
                    autoComplete="tel"
                  />
                </div>
              </div>

              <div className="pt-4">
                <Button
                  className="w-full bg-primary hover:bg-primary/90"
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    "Submit interest"
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground mt-4">
                  After submitting, you should receive an email confirmation at
                  the address you entered.
                </p>
              </div>
            </form>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default WorldScholarsCoaching;
