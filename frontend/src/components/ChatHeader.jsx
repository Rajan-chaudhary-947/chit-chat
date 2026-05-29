import { X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import { toTitleCase } from "../lib/utils.js";

const ChatHeader = () => {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const navigate = useNavigate();

  const profileImage = selectedUser.profilePic || "/avatar.png";
  const displayName = toTitleCase(selectedUser.fullName);

  const handleProfileClick = () => {
    navigate(`/profile/${selectedUser.userId}`);
  };

  return (
    <>
      <div className="p-2.5 border-b border-base-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="avatar"
              aria-label={`Preview ${displayName}'s profile picture`}
            >
              <div className="size-10 rounded-full relative">
                <img src={profileImage} alt={displayName} />
              </div>
            </button>

            {/* User info */}
            <button
              type="button"
              onClick={handleProfileClick}
              className="text-left hover:opacity-80 transition-opacity"
            >
              <h3 className="font-medium">{displayName}</h3>
              <p className="text-sm text-base-content/70">
                {onlineUsers.includes(selectedUser._id) ? "Online" : "Offline"}
              </p>
            </button>
          </div>

          {/* Close button */}
          <button onClick={() => setSelectedUser(null)} aria-label="Close chat">
            <X />
          </button>
        </div>
      </div>

      {isPreviewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setIsPreviewOpen(false)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setIsPreviewOpen(false)}
              className="absolute -right-2 -top-2 rounded-full bg-base-100 p-2 text-base-content shadow-lg hover:bg-base-200"
              aria-label="Close image preview"
            >
              <X className="size-5" />
            </button>
            <div className="overflow-hidden rounded-lg bg-base-100 p-2 shadow-2xl">
              <img
                src={profileImage}
                alt={displayName}
                className="max-h-[80vh] max-w-[80vw] rounded-md object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default ChatHeader;
