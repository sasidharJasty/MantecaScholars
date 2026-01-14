import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import { useAuth } from "@/contexts/AuthContext"
import { useNavigate } from "react-router-dom"
import { useEffect } from "react"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { useLocation } from "react-router-dom"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        if (!loading && !user) {
            navigate("/auth");
        }
    }, [user, loading, navigate]);

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    const pathSegments = location.pathname.split('/').filter(Boolean);

    return (
        <SidebarProvider>
            <AppSidebar />
            <main className="w-full bg-background min-h-screen">
                <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 bg-card">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4" />
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/">Home</BreadcrumbLink>
                            </BreadcrumbItem>
                            
                            {pathSegments.map((segment, index) => {
                                const path = `/${pathSegments.slice(0, index + 1).join('/')}`;
                                const isLast = index === pathSegments.length - 1;
                                const title = segment.charAt(0).toUpperCase() + segment.slice(1).replace('-', ' ');

                                return (
                                    <span key={path} className="flex items-center">
                                         <BreadcrumbSeparator />
                                         <BreadcrumbItem className="ml-2">
                                            {isLast ? (
                                                <BreadcrumbPage>{title}</BreadcrumbPage>
                                            ) : (
                                                <BreadcrumbLink href={path}>{title}</BreadcrumbLink>
                                            )}
                                        </BreadcrumbItem>
                                    </span>
                                );
                            })}
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>
                <div className="p-6 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </SidebarProvider>
    )
}
