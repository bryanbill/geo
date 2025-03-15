import ResultList from "./result-list";
import SearchBar from "./search-bar";
import { Sidebar, SidebarContent, SidebarFooter } from "./ui/sidebar";

export function AppSidebar() {
  
  return (
    <Sidebar>
      <SidebarContent>
        <ResultList  />
      </SidebarContent>
      <SidebarFooter>
        <SearchBar />
      </SidebarFooter>
    </Sidebar>
  );
}
