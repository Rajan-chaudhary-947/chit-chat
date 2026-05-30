import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { LogOut, MessageSquare, Search, Settings, User, X } from "lucide-react";

const Navbar = () => {
  const { logout, authUser } = useAuthStore();
  const { getUsers, users } = useChatStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (authUser && users.length === 0) getUsers();
  }, [authUser, getUsers, users.length]);

  const closeSearch = () => {
    setSearchQuery("");
    setIsSearchOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();

    const userId = searchQuery.trim().toLowerCase();
    if (!userId) {
      closeSearch();
      return;
    }
    closeSearch();
    navigate(`/profile/${userId}`);


    
  };

  const searchForm = (
    <form onSubmit={handleSearch} className="relative w-full">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-500" />
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search People"
        className="input input-sm input-bordered w-full pl-9"
        autoFocus={isSearchOpen}
      />
    </form>
  );

  return (
    <header
      className="bg-base-100 border-b border-base-300 fixed w-full top-0 z-40 
    backdrop-blur-lg bg-base-100/80"
    >
      <div className="container mx-auto px-4 h-16">
        <div className="flex items-center justify-between h-full">
          {isSearchOpen && (
            <div className="absolute inset-0 flex items-center gap-2 bg-base-100/95 px-4 backdrop-blur-lg sm:hidden">
              {searchForm}
              <button
                type="button"
                onClick={closeSearch}
                className="btn btn-ghost btn-sm btn-square"
                aria-label="Close search"
              >
                <X className="size-5" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-all">
              <div className="size-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-lg font-bold">Chit Chat</h1>
            </Link>
            {authUser && (
              <>
                <button
                  type="button"
                  onClick={() => setIsSearchOpen(true)}
                  className="btn btn-sm btn-ghost btn-square sm:hidden"
                  aria-label="Open search"
                >
                  <Search className="size-5" />
                </button>
                <div className="hidden w-64 sm:block">{searchForm}</div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Link
              to={"/settings"} 
              className={`
              btn btn-sm gap-2 transition-colors
              
              `}
            >
              <Settings className="w-4 h-4" />
              <span className="hidden md:inline">Settings</span>
            </Link>

            {authUser && (
              <>
                <Link to={"/profile"} className={`btn btn-sm gap-2`}>
                  <User className="size-5" />
                  <span className="hidden md:inline">Profile</span>
                </Link>

                <button className="flex gap-2 items-center" onClick={logout}>
                  <LogOut className="size-5" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
export default Navbar;
