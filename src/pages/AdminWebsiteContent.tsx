import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Save, Trash2, Users, Newspaper, RotateCcw } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { TablesInsert } from "@/integrations/supabase/types";
import { toast } from "@/hooks/use-toast";
import {
  defaultNewsItems,
  defaultTeamPageContent,
  fetchSiteContent,
  isNewsItems,
  isTeamPageContent,
  NewsItem,
  TeamMember,
  TeamPageContent,
} from "@/lib/siteContent";

type TeamSection = {
  key: keyof TeamPageContent;
  label: string;
  description: string;
};

const teamSections: TeamSection[] = [
  {
    key: "boardMembers",
    label: "Board of Directors and Coordinators",
    description: "Top leadership shown in the Board section on the Team page.",
  },
  {
    key: "programCoordinators",
    label: "Program Coordinators",
    description: "Program coordinator profiles in the Program Coordinators section.",
  },
  {
    key: "undersecretariat",
    label: "Undersecretariat",
    description: "Primary undersecretariat list shown by default.",
  },
  {
    key: "undersecretariatWithSahithi",
    label: "Undersecretariat Additional",
    description: "Additional visible undersecretariat profile(s).",
  },
  {
    key: "undersecretariatHidden",
    label: "Undersecretariat Hidden (Show More)",
    description: "Profiles shown only after clicking Show More.",
  },
  {
    key: "administrativeSupport",
    label: "Administrative Support",
    description: "Administrative support profiles.",
  },
];

const emptyTeamMember = (): TeamMember => ({
  name: "",
  title: "",
  roles: [],
  email: "",
});

const AdminWebsiteContent = () => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [loadingData, setLoadingData] = useState(true);
  const [savingTeam, setSavingTeam] = useState(false);
  const [savingNews, setSavingNews] = useState(false);

  const [teamContent, setTeamContent] = useState<TeamPageContent>(defaultTeamPageContent);
  const [newsItems, setNewsItems] = useState<NewsItem[]>(defaultNewsItems);

  useEffect(() => {
    if (!loading && !isAdmin()) {
      toast({
        title: "Access Denied",
        description: "Only admins can edit website content.",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    if (!loading && isAdmin()) {
      loadContent();
    }
  }, [loading, isAdmin, navigate]);

  const loadContent = async () => {
    setLoadingData(true);

    const [teamPageContent, homeNews] = await Promise.all([
      fetchSiteContent("team_page", defaultTeamPageContent, isTeamPageContent),
      fetchSiteContent("home_news", defaultNewsItems, isNewsItems),
    ]);

    setTeamContent(teamPageContent);
    setNewsItems(homeNews);
    setLoadingData(false);
  };

  const saveTeamContent = async () => {
    setSavingTeam(true);

    const teamPayload: TablesInsert<"website_content"> = {
      key: "team_page",
      title: "Team Page Profiles",
      content: teamContent as unknown as TablesInsert<"website_content">["content"],
      updated_by: user?.id ?? null,
    };

    const { error } = await supabase.from("website_content").upsert(teamPayload, {
      onConflict: "key",
    });

    setSavingTeam(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save Team page profiles.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Saved",
      description: "Team page profiles updated successfully.",
    });
  };

  const saveNewsContent = async () => {
    setSavingNews(true);

    const filteredItems = newsItems.filter(
      (item) => item.title.trim() && item.date.trim() && item.excerpt.trim(),
    );

    if (filteredItems.length === 0) {
      setSavingNews(false);
      toast({
        title: "Validation Error",
        description: "Add at least one complete news item before saving.",
        variant: "destructive",
      });
      return;
    }

    const newsPayload: TablesInsert<"website_content"> = {
      key: "home_news",
      title: "Homepage News",
      content: filteredItems as unknown as TablesInsert<"website_content">["content"],
      updated_by: user?.id ?? null,
    };

    const { error } = await supabase.from("website_content").upsert(newsPayload, {
      onConflict: "key",
    });

    setSavingNews(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save homepage news.",
        variant: "destructive",
      });
      return;
    }

    setNewsItems(filteredItems);
    toast({
      title: "Saved",
      description: "Homepage news updated successfully.",
    });
  };

  const resetToDefaults = async () => {
    const resetPayload: TablesInsert<"website_content">[] = [
      {
        key: "team_page",
        title: "Team Page Profiles",
        content: defaultTeamPageContent as unknown as TablesInsert<"website_content">["content"],
        updated_by: user?.id ?? null,
      },
      {
        key: "home_news",
        title: "Homepage News",
        content: defaultNewsItems as unknown as TablesInsert<"website_content">["content"],
        updated_by: user?.id ?? null,
      },
    ];

    const { error } = await supabase.from("website_content").upsert(resetPayload, {
      onConflict: "key",
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to reset defaults.",
        variant: "destructive",
      });
      return;
    }

    setTeamContent(defaultTeamPageContent);
    setNewsItems(defaultNewsItems);

    toast({
      title: "Defaults Restored",
      description: "Team and News content has been reset to defaults.",
    });
  };

  const updateTeamMember = (
    sectionKey: keyof TeamPageContent,
    index: number,
    field: keyof TeamMember,
    value: string,
  ) => {
    setTeamContent((prev) => {
      const section = [...prev[sectionKey]];
      const member = { ...section[index] };

      if (field === "roles") {
        member.roles = value
          .split(",")
          .map((role) => role.trim())
          .filter(Boolean);
      } else if (field === "email") {
        member.email = value;
      } else if (field === "name") {
        member.name = value;
      } else if (field === "title") {
        member.title = value;
      }

      section[index] = member;
      return {
        ...prev,
        [sectionKey]: section,
      };
    });
  };

  const addTeamMember = (sectionKey: keyof TeamPageContent) => {
    setTeamContent((prev) => ({
      ...prev,
      [sectionKey]: [...prev[sectionKey], emptyTeamMember()],
    }));
  };

  const removeTeamMember = (sectionKey: keyof TeamPageContent, index: number) => {
    setTeamContent((prev) => ({
      ...prev,
      [sectionKey]: prev[sectionKey].filter((_, idx) => idx !== index),
    }));
  };

  const updateNewsItem = (index: number, field: keyof NewsItem, value: string) => {
    setNewsItems((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? {
              ...item,
              [field]: value,
            }
          : item,
      ),
    );
  };

  const addNewsItem = () => {
    setNewsItems((prev) => [...prev, { title: "", date: "", excerpt: "" }]);
  };

  const removeNewsItem = (index: number) => {
    setNewsItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  if (loading || loadingData) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">Website Content Manager</h1>
            <p className="text-muted-foreground">
              Edit your Team page and Homepage News with a simple form-based editor.
            </p>
          </div>
          <Button variant="outline" onClick={resetToDefaults}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
        </div>

        <Tabs defaultValue="team" className="space-y-4">
          <TabsList className="grid grid-cols-2 w-full max-w-sm">
            <TabsTrigger value="team" className="gap-2">
              <Users className="w-4 h-4" />
              Team Profiles
            </TabsTrigger>
            <TabsTrigger value="news" className="gap-2">
              <Newspaper className="w-4 h-4" />
              Homepage News
            </TabsTrigger>
          </TabsList>

          <TabsContent value="team" className="space-y-5">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Team Profile Sections</CardTitle>
                <CardDescription>
                  Expand only the section you want to edit to keep this page compact.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Accordion type="multiple" defaultValue={["boardMembers"]} className="w-full">
                  {teamSections.map((section) => (
                    <AccordionItem key={section.key} value={section.key}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="text-left">
                          <p className="font-semibold">{section.label} ({teamContent[section.key].length})</p>
                          <p className="text-sm text-muted-foreground font-normal">{section.description}</p>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="flex justify-end mb-3">
                          <Button variant="outline" size="sm" onClick={() => addTeamMember(section.key)}>
                            <Plus className="w-4 h-4 mr-1" />
                            Add Person
                          </Button>
                        </div>

                        {teamContent[section.key].length === 0 && (
                          <p className="text-sm text-muted-foreground">No profiles yet. Click Add Person to create one.</p>
                        )}

                        <Accordion type="multiple" className="w-full">
                          {teamContent[section.key].map((member, index) => (
                            <AccordionItem key={`${section.key}-${index}`} value={`${section.key}-${index}`}>
                              <AccordionTrigger className="hover:no-underline py-3">
                                <div className="text-left">
                                  <p className="font-medium">{member.name || `Profile ${index + 1}`}</p>
                                  <p className="text-xs text-muted-foreground">{member.title || "Title not set"}</p>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="rounded-lg border p-4 space-y-3">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <Label>Name</Label>
                                      <Input
                                        value={member.name || ""}
                                        onChange={(e) => updateTeamMember(section.key, index, "name", e.target.value)}
                                        placeholder="Enter the full name exactly as it should appear on the Team page"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label>Title</Label>
                                      <Input
                                        value={member.title || ""}
                                        onChange={(e) => updateTeamMember(section.key, index, "title", e.target.value)}
                                        placeholder="Enter the official position/title shown directly below the name"
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <Label>Roles (comma-separated)</Label>
                                      <Input
                                        value={member.roles?.join(", ") || ""}
                                        onChange={(e) => updateTeamMember(section.key, index, "roles", e.target.value)}
                                        placeholder="Enter responsibilities or program coordination roles, separated by commas; leave empty if none"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <Label>Email (optional)</Label>
                                      <Input
                                        value={member.email || ""}
                                        onChange={(e) => updateTeamMember(section.key, index, "email", e.target.value)}
                                        placeholder="Enter contact email to display on the card, or leave empty to hide email"
                                      />
                                    </div>
                                  </div>

                                  <div className="flex justify-end">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-destructive hover:text-destructive"
                                      onClick={() => removeTeamMember(section.key, index)}
                                    >
                                      <Trash2 className="w-4 h-4 mr-1" />
                                      Remove
                                    </Button>
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={saveTeamContent} disabled={savingTeam}>
                <Save className="w-4 h-4 mr-2" />
                {savingTeam ? "Saving Team..." : "Save Team Changes"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="news" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <CardTitle>Recent News & Achievements</CardTitle>
                    <CardDescription>These cards appear on your homepage.</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={addNewsItem}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add News Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {newsItems.length === 0 && (
                  <p className="text-sm text-muted-foreground">No news items yet. Click Add News Item to create one.</p>
                )}

                <Accordion type="multiple" className="w-full">
                  {newsItems.map((item, index) => (
                    <AccordionItem key={`news-${index}`} value={`news-${index}`}>
                      <AccordionTrigger className="hover:no-underline py-3">
                        <div className="text-left">
                          <p className="font-medium">{item.title || `News Item ${index + 1}`}</p>
                          <p className="text-xs text-muted-foreground">{item.date || "Date not set"}</p>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="rounded-lg border p-4 space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <Label>Title</Label>
                              <Input
                                value={item.title}
                                onChange={(e) => updateNewsItem(index, "title", e.target.value)}
                                placeholder="Enter the headline text that should appear on the homepage news card"
                              />
                            </div>
                            <div className="space-y-1">
                              <Label>Date</Label>
                              <Input
                                value={item.date}
                                onChange={(e) => updateNewsItem(index, "date", e.target.value)}
                                placeholder="Enter the display date text exactly as visitors should read it"
                              />
                            </div>
                          </div>

                          <div className="space-y-1">
                            <Label>Description</Label>
                            <Textarea
                              rows={3}
                              value={item.excerpt}
                              onChange={(e) => updateNewsItem(index, "excerpt", e.target.value)}
                              placeholder="Describe the update in one or two clear sentences for homepage visitors"
                            />
                          </div>

                          <div className="flex justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => removeNewsItem(index)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={saveNewsContent} disabled={savingNews}>
                <Save className="w-4 h-4 mr-2" />
                {savingNews ? "Saving News..." : "Save News Changes"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AdminWebsiteContent;
