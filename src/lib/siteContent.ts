import { supabase } from "@/integrations/supabase/client";

export interface TeamMember {
  name: string;
  title: string;
  roles?: string[];
  email?: string;
}

export interface NewsItem {
  title: string;
  date: string;
  excerpt: string;
}

export interface TeamPageContent {
  boardMembers: TeamMember[];
  programCoordinators: TeamMember[];
  undersecretariat: TeamMember[];
  undersecretariatHidden: TeamMember[];
  undersecretariatWithSahithi: TeamMember[];
  administrativeSupport: TeamMember[];
}

export const defaultTeamPageContent: TeamPageContent = {
  boardMembers: [
    {
      name: "Miles Lima",
      title: "Founder, President and Director of Programs",
      roles: ["Program Coordinator: World Scholars Cup"],
    },
    {
      name: "Aditi Malgunde",
      title: "Director of Records and Archives",
      roles: ["Program Coordinator: American Medical Students Association and Women in STEM"],
    },
    {
      name: "Isabel Aquinde",
      title: "Co-Director of the Brand",
      roles: ["Program Coordinator: Model UN"],
    },
    {
      name: "Charlene Trinh",
      title: "Co-Director of the Brand",
    },
    {
      name: "Sagar Shah",
      title: "Director of Finance and Asset Management",
    },
    {
      name: "Nikitha Muruganagarajan",
      title: "Chief Advisor to the President; Director of Fundraising",
      roles: ["Program Coordinator: Skills USA, Science Olympiad and Quiz Bowl"],
    },
    {
      name: "Kaushik Chamchani",
      title: "Board Support Officer",
      roles: ["Program Coordinator: MS Math"],
    },
  ],
  programCoordinators: [
    {
      name: "Calypso Culbertson",
      title: "Program Coordinator for Mock Trial",
    },
    {
      name: "Snehal Bhaira",
      title: "Program Coordinator for Scholastic Art and Writing",
    },
  ],
  undersecretariat: [
    {
      name: "Sasidhar Jasty",
      title: "Sr. Undersecretary for Information Technology",
    },
    {
      name: "Shaurya Khairmode",
      title: "Director-General, Program Coordinator for MS Clash",
    },
    {
      name: "Sai Nellutla",
      title: "Sr. Undersecretary for Student Discipline",
      roles: ["Program Coordinator for Speech and Debate"],
    },
    {
      name: "Abhimanyu Nair",
      title: "Sr. Undersecretary for Grants and Sponsorships",
    },
    {
      name: "Harshith Kumar",
      title: "Sr. Undersecretary for Parent and Family Coordination",
    },
    {
      name: "Christina Addis",
      title: "Sr. Undersecretary for Events",
    },
    {
      name: "Nessa Jerald",
      title: "Sr. Undersecretary for Community Affairs",
    },
    {
      name: "Raunak Mahar",
      title: "Sr. Undersecretary for Student Development",
    },
  ],
  undersecretariatHidden: [
    {
      name: "Prithik Karthikeyan Manopriya",
      title: "Sr. Undersecretary for Internal Affairs",
    },
  ],
  undersecretariatWithSahithi: [
    {
      name: "Sahithi Kamma",
      title: "Sr. Undersecretary for Social Media; Administrative Support Officer",
    },
  ],
  administrativeSupport: [
    {
      name: "Tammana Grewal",
      title: "Executive Assistant",
    },
    {
      name: "Anjana Barath",
      title: "Administrative Support Officer",
    },
    {
      name: "Saanvi Srivastava",
      title: "Administrative Support Officer",
    },
  ],
};

export const defaultNewsItems: NewsItem[] = [
  {
    title: "Abhimanyu Nair Placed 2nd in the World for Best Debater",
    date: "December 2025",
    excerpt: "Abhimanyu Nair earned second place worldwide for Best Debater, marking a major international achievement for Manteca Scholars.",
  },
  {
    title: "Kaushik and Sagar Qualified for States",
    date: "March 2026",
    excerpt: "Kaushik and Sagar advanced to the state-level competition after a strong showing in qualifiers.",
  },
  {
    title: "Successful Tournament of Champions",
    date: "November 2025",
    excerpt: "Manteca Scholars celebrated a successful Tournament of Champions with standout performances across events.",
  },
];

const isTeamMember = (value: unknown): value is TeamMember => {
  if (!value || typeof value !== "object") return false;
  const member = value as Record<string, unknown>;
  if (typeof member.name !== "string" || typeof member.title !== "string") return false;
  if (member.roles !== undefined && !Array.isArray(member.roles)) return false;
  if (member.email !== undefined && typeof member.email !== "string") return false;
  return true;
};

const isTeamMemberList = (value: unknown): value is TeamMember[] => {
  return Array.isArray(value) && value.every(isTeamMember);
};

export const isTeamPageContent = (value: unknown): value is TeamPageContent => {
  if (!value || typeof value !== "object") return false;
  const content = value as Record<string, unknown>;
  return (
    isTeamMemberList(content.boardMembers) &&
    isTeamMemberList(content.programCoordinators) &&
    isTeamMemberList(content.undersecretariat) &&
    isTeamMemberList(content.undersecretariatHidden) &&
    isTeamMemberList(content.undersecretariatWithSahithi) &&
    isTeamMemberList(content.administrativeSupport)
  );
};

const isNewsItem = (value: unknown): value is NewsItem => {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.title === "string" &&
    typeof item.date === "string" &&
    typeof item.excerpt === "string"
  );
};

export const isNewsItems = (value: unknown): value is NewsItem[] => {
  return Array.isArray(value) && value.every(isNewsItem);
};

export const fetchSiteContent = async <T>(
  contentKey: string,
  fallback: T,
  validator: (value: unknown) => value is T,
): Promise<T> => {
  const { data, error } = await supabase
    .from("website_content")
    .select("content")
    .eq("key", contentKey)
    .maybeSingle();

  if (error || !data) {
    return fallback;
  }

  return validator(data.content) ? data.content : fallback;
};
