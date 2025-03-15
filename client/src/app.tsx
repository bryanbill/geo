import MapComponent from "./components/map-component";

import "./styles/globals.css";
import { SidebarProvider, SidebarTrigger } from "./components/ui/sidebar";
import { AppSidebar } from "./components/app-sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "./components/ui/avatar";
import { Toaster } from "./components/ui/sonner";
import { SearchProvider } from "./context/search-context";

function App() {
  return (
    <SearchProvider>
      <SidebarProvider className="flex h-screen max-h-screen ">
        <AppSidebar />
        <main className="flex flex-col w-full h-full ">
          <div className="px-4 py-2 flex flex-row justify-between items-center">
            <SidebarTrigger />
            <Avatar onClick={() => open("https://github.com/bryanbill/geo")}>
              <AvatarImage src="https://e7.pngegg.com/pngimages/1003/487/png-clipart-github-pages-random-icons-white-logo.png" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          </div>
          <div className="px-4 w-full h-full">
            <MapComponent />
            <Toaster />
          </div>
        </main>
      </SidebarProvider>
    </SearchProvider>
  );
}

export default App;
