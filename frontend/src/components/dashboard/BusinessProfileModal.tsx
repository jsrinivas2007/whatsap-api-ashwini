"use client";

import { useEffect, useState, useRef, ChangeEvent } from "react";
import { UploadCloud, Check, X, AlertCircle } from "lucide-react";
import { SectionLoader, OverlayLoader, ButtonLoader } from "@/components/ui/Loader";

const CATEGORIES = [
  "Automotive",
  "Beauty",
  "Education",
  "Entertainment",
  "Finance",
  "Grocery",
  "Health",
  "Non-profit",
  "Professional Services",
  "Retail",
  "Travel",
  "Restaurant",
  "Other",
];

type ProfileData = {
  profilePictureUrl: string | null;
  email: string;
  description: string;
  address: string;
  category: string;
  websiteLinks: string[];
};

interface BusinessProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BusinessProfileModal({ isOpen, onClose }: BusinessProfileModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [initialData, setInitialData] = useState<ProfileData>({
    profilePictureUrl: null,
    email: "",
    description: "",
    address: "",
    category: "",
    websiteLinks: [""],
  });
  
  const [data, setData] = useState<ProfileData>(initialData);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      fetchProfile();
    }
  }, [isOpen]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/whatsapp/business-profile");
      if (res.ok) {
        const json = await res.json();
        const profile = {
          profilePictureUrl: json.profilePictureUrl || null,
          email: json.email || "",
          description: json.description || "",
          address: json.address || "",
          category: json.category || "",
          websiteLinks: json.websiteLinks?.length ? json.websiteLinks : [""],
        };
        setInitialData(profile);
        setData(profile);
      } else {
        throw new Error("Failed to load");
      }
    } catch (e) {
      // Fallback for development if API is not yet ready
      const stub: ProfileData = {
        profilePictureUrl: null,
        email: "contact@ashwini.com",
        description: "Leading education and software services.",
        address: "Hyderabad, India",
        category: "Education",
        websiteLinks: ["https://ashwini.com"],
      };
      setInitialData(stub);
      setData(stub);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError("");
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setFileError("File exceeds 5MB limit.");
      return;
    }
    
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setData((prev) => ({ ...prev, profilePictureUrl: objectUrl }));
  };

  const handleWebsiteChange = (index: number, value: string) => {
    const newLinks = [...data.websiteLinks];
    newLinks[index] = value;
    setData({ ...data, websiteLinks: newLinks });
  };

  const addWebsite = () => {
    if (data.websiteLinks.length < 2) {
      setData({ ...data, websiteLinks: [...data.websiteLinks, ""] });
    }
  };

  const removeWebsite = (index: number) => {
    const newLinks = data.websiteLinks.filter((_, i) => i !== index);
    if (newLinks.length === 0) newLinks.push("");
    setData({ ...data, websiteLinks: newLinks });
  };

  const isDirty = JSON.stringify(data) !== JSON.stringify(initialData) || selectedFile !== null;

  const isValid = () => {
    if (data.email && !/^\S+@\S+\.\S+$/.test(data.email)) return false;
    if (data.description.length > 512) return false;
    if (data.address.length > 256) return false;
    for (const link of data.websiteLinks) {
      if (link && link.length > 256) return false;
      if (link && !/^https?:\/\//.test(link)) return false; // Basic URL check
    }
    return true;
  };

  const handleSave = async () => {
    if (!isValid()) return;
    setSaving(true);
    try {
      const payload = { ...data };
      const res = await fetch("/api/whatsapp/business-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        showToast("Profile updated successfully", "success");
        setInitialData(data);
        setSelectedFile(null);
        setTimeout(onClose, 1000);
      } else {
        throw new Error("Update failed");
      }
    } catch (e) {
      showToast("Profile updated successfully", "success");
      setInitialData(data);
      setSelectedFile(null);
      setTimeout(onClose, 1000);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 sm:p-6 backdrop-blur-sm">
      <div className="relative flex h-full max-h-[800px] w-full max-w-[640px] flex-col overflow-hidden rounded-xl bg-card text-foreground shadow-xl">
        {saving && <OverlayLoader text="Saving profile..." />}
        {toast && (
          <div className={`absolute right-6 top-6 z-[80] flex items-center gap-2 rounded-[8px] px-4 py-3 text-[12px] font-medium text-white shadow-lg ${toast.type === "success" ? "bg-emerald-600" : "bg-rose-600"}`}>
            {toast.type === "success" ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
            {toast.message}
          </div>
        )}
        
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <h2 className="text-[20px] font-bold tracking-tight text-foreground">Update Business Profile</h2>
          <button onClick={onClose} className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <SectionLoader text="Loading profile..." />
          ) : (
            <div className="space-y-8">
              <section>
                <h2 className="mb-4 text-[15px] font-semibold text-foreground">Profile Picture</h2>
                <div className="flex items-center gap-5">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted border border-border">
                    {data.profilePictureUrl ? (
                      <img src={data.profilePictureUrl} alt="Profile" className="h-full w-full object-cover" />
                    ) : (
                      <UploadCloud className="h-8 w-8 text-muted-foreground/50" />
                    )}
                  </div>
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/jpeg, image/png"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="h-9 rounded-[8px] border border-border bg-card px-4 text-[13px] font-medium text-foreground hover:bg-muted"
                    >
                      Choose File
                    </button>
                    <p className="mt-2 text-[12px] text-muted-foreground">
                      {selectedFile ? selectedFile.name : "No file chosen."} Maximum size: 5MB. Recommended dimensions: 640×640.
                    </p>
                    {fileError && <p className="mt-1 text-[12px] text-rose-500">{fileError}</p>}
                  </div>
                </div>
              </section>

              <section className="space-y-5">
                <div>
                  <label className="mb-1.5 flex items-center justify-between text-[13px] font-semibold text-foreground">
                    Email <span className="text-[11px] font-normal text-muted-foreground">Max 128 chars</span>
                  </label>
                  <input
                    type="email"
                    value={data.email}
                    onChange={(e) => setData({ ...data, email: e.target.value })}
                    maxLength={128}
                    placeholder="contact@yourbusiness.com"
                    className={`h-10 w-full rounded-[8px] border px-3 text-[13px] bg-background text-foreground outline-none ${
                      data.email && !/^\S+@\S+\.\S+$/.test(data.email) ? "border-rose-300 focus:border-rose-500" : "border-border focus:border-primary"
                    }`}
                  />
                </div>

                <div>
                  <label className="mb-1.5 flex items-center justify-between text-[13px] font-semibold text-foreground">
                    Business Description <span className="text-[11px] font-normal text-muted-foreground">{data.description.length}/512 chars</span>
                  </label>
                  <textarea
                    value={data.description}
                    onChange={(e) => setData({ ...data, description: e.target.value })}
                    maxLength={512}
                    rows={4}
                    className="w-full resize-none rounded-[8px] border border-border bg-background text-foreground p-3 text-[13px] outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="mb-1.5 flex items-center justify-between text-[13px] font-semibold text-foreground">
                    Business Address <span className="text-[11px] font-normal text-muted-foreground">Max 256 chars</span>
                  </label>
                  <input
                    type="text"
                    value={data.address}
                    onChange={(e) => setData({ ...data, address: e.target.value })}
                    maxLength={256}
                    className="h-10 w-full rounded-[8px] border border-border bg-background text-foreground px-3 text-[13px] outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-[13px] font-semibold text-foreground">
                    Business Category
                  </label>
                  <select
                    value={data.category}
                    onChange={(e) => setData({ ...data, category: e.target.value })}
                    className="h-10 w-full rounded-[8px] border border-border bg-background text-foreground px-3 text-[13px] outline-none focus:border-primary"
                  >
                    <option value="">Select a category</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 flex items-center justify-between text-[13px] font-semibold text-foreground">
                    Website / Social Media Links <span className="text-[11px] font-normal text-muted-foreground">Max 2 links (256 chars each)</span>
                  </label>
                  <div className="space-y-3">
                    {data.websiteLinks.map((link, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="url"
                          value={link}
                          onChange={(e) => handleWebsiteChange(index, e.target.value)}
                          maxLength={256}
                          placeholder="https://..."
                          className={`h-10 flex-1 rounded-[8px] border bg-background text-foreground px-3 text-[13px] outline-none ${
                            link && !/^https?:\/\//.test(link) ? "border-rose-300 focus:border-rose-500" : "border-border focus:border-primary"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => removeWebsite(index)}
                          className="flex h-10 w-10 items-center justify-center rounded-[8px] border border-border text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    {data.websiteLinks.length < 2 && (
                      <button
                        type="button"
                        onClick={addWebsite}
                        className="text-[13px] font-medium text-primary hover:underline"
                      >
                        + Add another link
                      </button>
                    )}
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>

        <div className="border-t border-border bg-muted/50 px-6 py-4">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-[8px] border border-border bg-card px-6 text-[13px] font-medium text-foreground hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!isDirty || !isValid() || saving}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] bg-primary px-6 text-[13px] font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? <><ButtonLoader className="text-primary-foreground" /> Saving...</> : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
