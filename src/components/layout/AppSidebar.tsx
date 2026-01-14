import { 
  Users, 
  Settings, 
  Shield, 
  Database, 
  LayoutDashboard, 
  BookOpen,
  UserCheck,
  Crown,
  MessageSquare
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/AuthContext"
import { Link, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"

export function AppSidebar() {
  const { profile, isAdmin, signOut } = useAuth()
  const location = useLocation()
  
  const isActive = (path: string) => location.pathname === path

  return (
    <Sidebar>
      <SidebarContent>
        {/* Main Dashboard */}
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive("/dashboard")}>
                  <Link to="/dashboard">
                    <LayoutDashboard />
                    <span>My Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                 <SidebarMenuButton asChild isActive={isActive("/programs")}>
                  <Link to="/programs">
                    <BookOpen />
                    <span>Browse Programs</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Team Leader Section */}
        <SidebarGroup>
            <SidebarGroupLabel>Leadership</SidebarGroupLabel>
            <SidebarGroupContent>
                 <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={isActive("/team-leader")}>
                            <Link to="/team-leader">
                                <Crown />
                                <span>Team Leader Dashboard</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                 </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Section */}
        {isAdmin() && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/admin")}>
                    <Link to="/admin">
                      <Shield />
                      <span>Admin Overview</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/admin/chat")}>
                    <Link to="/admin/chat">
                      <MessageSquare />
                      <span>Admin HQ Chat</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                
                {/* Specific Dashboard Levels */}
                {profile?.role === 'admin_i' && (
                   <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/admin/level-i")}>
                      <Link to="/admin/level-i">
                        <Shield className="text-yellow-500" />
                        <span>Level I Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {profile?.role === 'admin_ii' && (
                   <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/admin/level-ii")}>
                      <Link to="/admin/level-ii">
                        <Shield className="text-orange-500" />
                        <span>Level II Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {profile?.role === 'admin_iii' && (
                   <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/admin/level-iii")}>
                      <Link to="/admin/level-iii">
                        <Shield className="text-red-500" />
                        <span>Level III Dashboard</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={isActive("/admin/programs")}>
                    <Link to="/admin/programs">
                      <Database />
                      <span>Manage Programs</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/admin/my-programs")}>
                      <Link to="/admin/my-programs">
                        <BookOpen />
                        <span>My Assigned Programs</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                 {(profile?.role === 'admin_ii' || profile?.role === 'admin_iii') && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/admin/approvals")}>
                      <Link to="/admin/approvals">
                        <UserCheck />
                        <span>Approvals</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}

                {profile?.role === 'admin_iii' && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={isActive("/admin/users")}>
                      <Link to="/admin/users">
                        <Users />
                        <span>Manage Users</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
         <div className="p-4">
            <Button variant="outline" className="w-full" onClick={() => signOut()}>
                Sign Out
            </Button>
         </div>
      </SidebarFooter>
    </Sidebar>
  )
}
