import { Badge } from "@/components/ui/badge";
import { Crown, Shield, User } from "lucide-react";

interface RoleBadgeProps {
  role: string | null | undefined;
}

export const RoleBadge = ({ role }: RoleBadgeProps) => {
  if (!role) return null;

  const getBadgeConfig = (role: string) => {
    switch (role) {
      case 'admin_iii':
        return {
          label: 'Super Admin',
          color: 'bg-red-500 hover:bg-red-600',
          icon: <Crown className="w-3 h-3 mr-1" />
        };
      case 'admin_ii':
        return {
          label: 'Director',
          color: 'bg-orange-500 hover:bg-orange-600',
          icon: <Shield className="w-3 h-3 mr-1" />
        };
      case 'admin_i':
        return {
          label: 'Manager',
          color: 'bg-yellow-500 hover:bg-yellow-600',
          icon: <Shield className="w-3 h-3 mr-1" />
        };
      case 'team_leader':
        return {
          label: 'Team Leader',
          color: 'bg-blue-500 hover:bg-blue-600',
          icon: <Crown className="w-3 h-3 mr-1 text-yellow-300" />
        };
      default:
        return {
          label: 'Student',
          color: 'bg-slate-500 hover:bg-slate-600',
          icon: <User className="w-3 h-3 mr-1" />
        };
    }
  };

  const config = getBadgeConfig(role);

  return (
    <Badge className={`${config.color} text-white border-0 flex items-center w-fit`}>
      {config.icon}
      {config.label}
    </Badge>
  );
};
