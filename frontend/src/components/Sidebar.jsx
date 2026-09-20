import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users } from "lucide-react";
import { toTitleCase } from "../lib/utils.js";

const Sidebar = () => {
  const { getUsers, users, selectedUser, setSelectedUser, isUsersLoading } = useChatStore();

  const { onlineUsers } = useAuthStore();
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    getUsers();
  }, [getUsers]);

  const filteredUsers = showOnlineOnly
    ? users.filter((user) => onlineUsers.includes(user._id))
    : users;

  if (isUsersLoading) return <SidebarSkeleton />;

  const handleSelectUser = (user) => {
    setSelectedUser(user);

    if (window.innerWidth < 1024) {
      setIsCollapsed(true);
    }
  };

  return (
    <aside
      className={`h-full ${
        isCollapsed ? "w-20" : "w-50 lg:w-72"
      } border-r border-base-300 flex flex-col transition-all duration-200`}
    >
      <div className="border-b border-base-300 w-full p-5">
        <button
          type="button"
          onClick={() => setIsCollapsed((collapsed) => !collapsed)}
          className="flex items-center gap-2"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <Users className="size-6" />
          <span className={`font-medium  ${isCollapsed ? "hidden" : "block"}`}>Contacts</span>
        </button>
        <div className={`mt-3  ${isCollapsed ? "hidden" : "flex"} items-center gap-2`}>
          <label className="cursor-pointer flex items-center gap-2">
            <input
              type="checkbox"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="checkbox checkbox-sm"
            />
            <span className="text-sm">Show online only</span>
          </label>
          <span className="text-xs text-zinc-500">({onlineUsers.length} online)</span>
        </div>
      </div>

      <div className="overflow-y-auto w-full py-3">
        {filteredUsers.map((user) => (
          <button
            key={user._id}
            onClick={() => handleSelectUser(user)}
            className={`
              w-full p-3 flex items-center gap-3
              hover:bg-base-300 transition-colors
              ${selectedUser?._id === user._id ? "bg-base-300 ring-1 ring-base-300" : ""}
            `}
          >
            <div className="relative mx-0">
              <img
                src={user.profilePic || "/avatar.png"}
                alt={toTitleCase(user.fullName)}
                className="size-12 object-cover rounded-full"
              />
              {onlineUsers.includes(user._id) && (
                <span
                  className="absolute bottom-0 right-0 size-3 bg-green-500 
                  rounded-full ring-2 ring-zinc-900"
                />
              )}
            </div>

            {/* User info - only visible on larger screens */}
            <div className={`${isCollapsed ? "hidden" : "block"} text-left min-w-0`}>
              <div className="font-medium truncate">{toTitleCase(user.fullName)}</div>
              <div className="text-sm text-zinc-400">
                {onlineUsers.includes(user._id) ? "Online" : "Offline"}
              </div>
            </div>
          </button>
        ))}

        {filteredUsers.length === 0 && (
          <div className="text-center text-zinc-500 py-4">
            {showOnlineOnly ? "No connected users online" : "No connected users"}
          </div>
        )}
      </div>
    </aside>
  );
};
export default Sidebar;
