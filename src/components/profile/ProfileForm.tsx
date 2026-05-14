"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";
import { useToast } from "@/components/ToastProvider";
import Avatar from "@/components/ui/Avatar";
import { updateProfile } from "@/actions/profile";
import { getProfileImageUrl } from "@/lib/profileImageUrl";
import type { Session, DictionarySection } from "@/lib/types";

interface ProfileFormProps {
  lang: string;
  user: Session | null;
  intl: DictionarySection;
}

export default function ProfileForm({ lang, user, intl }: ProfileFormProps) {
  const router = useRouter();
  const toast = useToast();
  if (!toast) throw new Error("ProfileForm must be used within ToastProvider");
  const { addToast } = toast;

  const [formData, setFormData] = useState({
    name: user?.name || "",
    lastname: user?.lastname || "",
    password: "",
  });
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [removeProfileImage, setRemoveProfileImage] = useState(false);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    getProfileImageUrl(user?.profileImage)
  );

  const profile = intl.profile as DictionarySection;
  const toastUsers = intl.toastUsers as DictionarySection;

  useEffect(() => {
    if (removeProfileImage) {
      setProfileImagePreview(null);
      return;
    }

    if (!profileImage) {
      setProfileImagePreview(getProfileImageUrl(user?.profileImage));
      return;
    }

    const objectUrl = URL.createObjectURL(profileImage);
    setProfileImagePreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [profileImage, removeProfileImage, user?.profileImage]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleProfileImageChange = (file: File | null) => {
    setRemoveProfileImage(false);
    setProfileImage(file);
  };

  const handleRemoveProfileImage = () => {
    setProfileImage(null);
    setRemoveProfileImage(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload = new FormData();
    payload.set("name", formData.name);
    payload.set("lastname", formData.lastname);
    payload.set("password", formData.password);
    payload.set("removeProfileImage", removeProfileImage ? "true" : "false");

    if (profileImage) {
      payload.set("profileImage", profileImage);
    }

    const result = await updateProfile(payload, lang);

    if (result.success) {
      setFormData((prevData) => ({ ...prevData, password: "" }));
      setProfileImage(null);
      setRemoveProfileImage(false);
      addToast({
        title: toastUsers.successTt as string,
        description: toastUsers.successUpdate as string,
        variant: "success",
      });
      router.refresh();
      setTimeout(() => {
        router.refresh();
      }, 150);
    } else {
      addToast({
        title: toastUsers.errorTt as string,
        description: (result.error as string) || (toastUsers.errorUpdate as string),
        variant: "error",
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-6 mb-8">
          <div className="relative group w-28 h-28 shrink-0">
            <Avatar
              name={formData.name || user?.name}
              lastname={formData.lastname || user?.lastname}
              imageUrl={profileImagePreview}
              alt={`${formData.name || user?.name || user?.username || "User"} ${
                formData.lastname || user?.lastname || ""
              }`.trim()}
              className="w-28 h-28 text-3xl"
            />
            {profileImagePreview && (
              <button
                type="button"
                onClick={handleRemoveProfileImage}
                title={profile.removePicture as string}
                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-full bg-red-700 hover:bg-red-800 text-white p-1.5 cursor-pointer"
              >
                <Trash2Icon size={14} />
              </button>
            )}
          </div>
          <div className="w-full">
            <label className="block text-sm mb-2">{profile.picture as string}</label>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => handleProfileImageChange(e.target.files?.[0] ?? null)}
              className="text-sand bg-onix border border-neutral-700 hover:border-pearl rounded-lg w-full px-5 py-3 transition-all duration-300 file:mr-4 file:border-0 file:bg-lilah file:text-pearl file:px-4 file:py-2 file:rounded-md"
            />
            <p className="text-xs text-neutral-400 mt-2">
              {profile.pictureHelp as string}
            </p>
          </div>
        </div>
        <input
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="text-sand bg-onix border border-neutral-700 hover:border-pearl rounded-lg w-full px-5 py-3 transition-all duration-300"
          placeholder={profile.name as string}
        />
        <input
          name="lastname"
          value={formData.lastname}
          onChange={handleChange}
          className="text-sand bg-onix border border-neutral-700 hover:border-pearl rounded-lg w-full px-5 py-3 transition-all duration-300"
          placeholder={profile.lastname as string}
        />
        <input
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          className="text-sand bg-onix border border-neutral-700 hover:border-pearl rounded-lg w-full px-5 py-3 transition-all duration-300"
          placeholder={profile.password as string}
        />
        <button
          type="submit"
          className="font-bold px-8 py-4 rounded-lg leading-none uppercase text-sand bg-blackamber border border-blackamber hover:text-onix hover:bg-pearl hover:border-pearl transition-all duration-300 cursor-pointer"
        >
          {profile.save as string}
        </button>
      </form>
    </div>
  );
}
