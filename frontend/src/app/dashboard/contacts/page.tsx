"use client";

import { ChangeEvent, DragEvent, useEffect, useMemo, useState } from "react";
import {
  Download,
  ExternalLink,
  FileText,
  Filter,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { SectionLoader, OverlayLoader, ButtonLoader } from "@/components/ui/Loader";
import { parseContactsCSV } from "@/utils/csvParser";

export type Source = "Excel Upload" | "Chat" | "Manual" | "API" | "CSV Upload";
export type Contact = {
  id: string;
  name: string;
  countryCode: string;
  whatsapp: string;
  source: Source;
  tags: string[];
  attributes: Record<string, string>;
  optedOut: boolean;
  createdAt: string;
};
type FilterTag = { id: number; value: string };
type AttributeFilter = {
  id: number;
  name: string;
  condition: string;
  value: string;
};

const seedContacts: Contact[] = [
  {
    id: "contact-1",
    name: "SINDHU",
    countryCode: "91",
    whatsapp: "9866011981",
    source: "Excel Upload",
    tags: ["Hot Lead"],
    attributes: { City: "Hyderabad", Course: "BCA" },
    optedOut: false,
    createdAt: "2026-09-22",
  },
  {
    id: "contact-2",
    name: "srinivas",
    countryCode: "91",
    whatsapp: "9964011126",
    source: "Chat",
    tags: ["No Response"],
    attributes: { City: "Bengaluru" },
    optedOut: false,
    createdAt: "2026-09-21",
  },
  {
    id: "contact-3",
    name: "Rahul Sharma",
    countryCode: "91",
    whatsapp: "9876543210",
    source: "CSV Upload",
    tags: ["Hot Lead"],
    attributes: { City: "Mumbai" },
    optedOut: false,
    createdAt: "2026-09-20",
  },
  {
    id: "contact-4",
    name: "Priya Patel",
    countryCode: "91",
    whatsapp: "9876543211",
    source: "Manual",
    tags: ["In Progress"],
    attributes: { Course: "MBA" },
    optedOut: true,
    createdAt: "2026-09-19",
  },
];

// Removed static tagOptions and attributeOptions
const sourceStyles: Record<Source, string> = {
  "Excel Upload": "bg-emerald-50 text-emerald-700",
  Chat: "bg-blue-50 text-blue-700",
  Manual: "bg-slate-100 text-slate-700",
  API: "bg-violet-50 text-violet-700",
  "CSV Upload": "bg-amber-50 text-amber-700",
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<string[]>([]);
  const [modal, setModal] = useState<"filter" | "contact" | "import" | null>(
    null,
  );
  const [editing, setEditing] = useState<Contact | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tagFilters, setTagFilters] = useState<FilterTag[]>([]);
  const [attributeFilters, setAttributeFilters] = useState<AttributeFilter[]>(
    [],
  );
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [excludeOptedOut, setExcludeOptedOut] = useState(false);
  const [availableTags, setAvailableTags] = useState<{name: string, color: string}[]>([]);
  const [availableAttributes, setAvailableAttributes] = useState<string[]>([]);

  const fetchContacts = async () => {
    try {
      const res = await fetch("/api/contacts");
      if (res.ok) {
        const data = await res.json();
        const mapped = data.map((c: any) => ({
          id: c.id,
          name: c.name || "Unnamed",
          countryCode: c.country_code || "",
          whatsapp: c.whatsapp_number,
          source: c.source === "csv_upload" ? "CSV Upload" : c.source === "excel_upload" ? "Excel Upload" : c.source === "api" ? "API" : c.source === "chat" ? "Chat" : "Manual",
          tags: c.tags || [],
          attributes: c.attributes || {},
          optedOut: c.opted_out || false,
          createdAt: c.created_at,
        }));
        setContacts(mapped);
      }
      
      const [tagsRes, attrsRes] = await Promise.all([
        fetch("/api/tags"),
        fetch("/api/attribute-definitions")
      ]);
      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        setAvailableTags(tagsData);
      }
      if (attrsRes.ok) {
        const attrsData = await attrsRes.json();
        setAvailableAttributes(attrsData.map((a: any) => a.key_name));
      }
    } catch (err) {
      console.error(err);
      notify("Failed to load contacts data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2200);
  };
  const filtered = useMemo(
    () =>
      contacts
        .filter((contact) =>
          `${contact.name} ${contact.countryCode}${contact.whatsapp}`
            .toLowerCase()
            .includes(appliedQuery.toLowerCase()),
        )
        .filter((contact) => !excludeOptedOut || !contact.optedOut)
        .filter((contact) =>
          activeTags.every((tag) => contact.tags.includes(tag)),
        )
        .filter((contact) =>
          attributeFilters.every((filter) => {
            const actual = contact.attributes[filter.name] ?? "";
            if (filter.condition === "Is Empty") return !actual;
            if (filter.condition === "Is Not Empty") return Boolean(actual);
            if (filter.condition === "Not Equal")
              return actual !== filter.value;
            if (filter.condition === "Contains")
              return actual.toLowerCase().includes(filter.value.toLowerCase());
            if (filter.condition === "Starts With")
              return actual
                .toLowerCase()
                .startsWith(filter.value.toLowerCase());
            return actual.toLowerCase() === filter.value.toLowerCase();
          }),
        ),
    [contacts, appliedQuery, activeTags, attributeFilters, excludeOptedOut],
  );
  const pageContacts = filtered.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const toggleSelected = (id: string) =>
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  const toggleAll = () =>
    setSelected((current) =>
      pageContacts.every((contact) => current.includes(contact.id))
        ? current.filter(
            (id) => !pageContacts.some((contact) => contact.id === id),
          )
        : [
            ...new Set([
              ...current,
              ...pageContacts.map((contact) => contact.id),
            ]),
          ],
    );
  const exportContacts = () => {
    const csv = [
      "Name,CountryCode,Whatsapp,Source,Tags,OptedOut",
      ...filtered.map((contact) =>
        [
          contact.name,
          contact.countryCode,
          contact.whatsapp,
          contact.source,
          contact.tags.join("|"),
          contact.optedOut,
        ].join(","),
      ),
    ].join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    link.download = "contacts.csv";
    link.click();
    URL.revokeObjectURL(link.href);
    notify("Contacts exported");
  };
  const saveContact = async (contact: Contact) => {
    try {
      const payload = {
        name: contact.name,
        country_code: contact.countryCode,
        whatsapp_number: contact.whatsapp,
        tags: contact.tags,
        attributes: contact.attributes,
      };
      
      const url = editing ? `/api/contacts/${contact.id}` : "/api/contacts";
      const method = editing ? "PATCH" : "POST";
      
      console.log("FRONTEND ABOUT TO FETCH:", method, url, JSON.stringify(payload));
      
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Operation failed");
      }
      
      await fetchContacts();
      setModal(null);
      setEditing(null);
      notify(editing ? "Contact updated" : "Contact added");
    } catch (err: any) {
      notify(`Error: ${err.message}`);
    }
  };
  const deleteContact = async (contact: Contact) => {
    if (!window.confirm(`Delete ${contact.name}?`)) return;
    try {
      const res = await fetch(`/api/contacts/${contact.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      await fetchContacts();
      notify("Contact deleted");
    } catch (err: any) {
      notify(`Error: ${err.message}`);
    }
  };
  const applyFilters = () => {
    setPage(1);
    setActiveTags(tagFilters.map((filter) => filter.value).filter(Boolean));
    setModal(null);
    notify("Filters applied");
  };

  return (
    <div className="min-h-full text-foreground">
      {toast ? (
        <div className="fixed right-6 top-6 z-[80] rounded-[8px] bg-foreground px-4 py-3 text-[12px] font-medium text-background shadow-lg">
          {toast}
        </div>
      ) : null}
      <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-[30px] font-bold tracking-[-0.03em]">Contacts</h2>
          <p className="mt-2 text-[14px] text-muted-foreground">
            Your contacts, ready for every campaign
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setModal("contact");
            }}
            className="inline-flex h-10 items-center gap-2 rounded-[8px] bg-[#1B2CC1] px-4 text-[13px] font-semibold text-white"
          >
            <Plus className="h-4 w-4" /> Add Contact
          </button>
          <button
            type="button"
            onClick={() => setModal("import")}
            className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-border bg-card px-4 text-[13px] font-medium text-foreground hover:bg-muted"
          >
            <Upload className="h-4 w-4" /> Import Contacts
          </button>
        </div>
      </div>
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex w-full max-w-[520px] gap-2">
          <div className="flex h-10 flex-1 items-center gap-2 rounded-[8px] border border-border bg-background px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  setAppliedQuery(query);
                  setPage(1);
                }
              }}
              placeholder="Search by name or number"
              className="w-full text-[13px] bg-transparent outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setAppliedQuery(query);
              setPage(1);
            }}
            className="h-10 rounded-[8px] bg-[#1B2CC1] px-4 text-[13px] font-semibold text-white"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setModal("filter")}
            className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-border bg-card px-3 text-[13px] font-medium text-foreground hover:bg-muted"
          >
            <Filter className="h-4 w-4" /> Filter
          </button>
        </div>
        <div className="flex items-center gap-4 text-[13px] text-muted-foreground">
          <span>{filtered.length} Contacts</span>
          <button
            type="button"
            onClick={exportContacts}
            className="font-semibold text-[#1B2CC1]"
          >
            Export
          </button>
        </div>
      </div>
      <div className="w-full rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full text-left">
            <thead className="bg-muted/50 text-[11px] uppercase tracking-[0.08em] text-muted-foreground border-b border-border">
              <tr>
                {["Name", "WhatsApp Number", "Source", "Tags", "Action"].map(
                  (heading) => (
                    <th
                      key={heading}
                      className="px-5 py-4 font-semibold"
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="h-64 relative">
                    <SectionLoader text="Loading contacts..." />
                  </td>
                </tr>
              ) : pageContacts.length ? (
                pageContacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="border-b border-border text-[13px] last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#dfe7ff] font-semibold text-[#1d4ed8]">
                          {contact.name.slice(0, 1).toUpperCase()}
                        </span>
                        <span className="font-semibold">{contact.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      +{contact.countryCode} {contact.whatsapp}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${sourceStyles[contact.source]}`}
                      >
                        {contact.source}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {contact.tags.length ? (
                        <div className="flex flex-wrap gap-1">
                          {contact.tags.map((tag) => {
                            const tagDef = availableTags.find(t => t.name === tag);
                            const color = tagDef?.color || '#1d4ed8';
                            return (
                              <span
                                key={tag}
                                className="rounded-full px-2 py-1 text-[10px]"
                                style={{ backgroundColor: `${color}15`, color }}
                              >
                                {tag}
                              </span>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            (window.location.href = `/dashboard/chats?contact=${contact.id}`)
                          }
                          aria-label="Open chat"
                          className="flex h-8 w-8 items-center justify-center rounded-[6px] text-muted-foreground hover:bg-muted"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(contact);
                            setModal("contact");
                          }}
                          aria-label="Edit contact"
                          className="flex h-8 w-8 items-center justify-center rounded-[6px] text-muted-foreground hover:bg-muted"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteContact(contact)}
                          aria-label="Delete contact"
                          className="flex h-8 w-8 items-center justify-center rounded-[6px] text-rose-500 hover:bg-rose-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-16 text-center">
                    <Users className="mx-auto mb-3 h-9 w-9 text-muted-foreground/50" />
                    <p className="text-[14px] font-semibold text-foreground">No contacts yet</p>
                    <p className="mt-1 text-[12px] text-muted-foreground">
                      Add or import contacts to get started.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[12px] text-muted-foreground">
        <span>{selected.length} selected</span>
        <div className="flex items-center gap-2">
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
            className="rounded-[6px] border border-border bg-background px-2 py-1 text-foreground"
          >
            <option value="25">25 / page</option>
            <option value="50">50 / page</option>
          </select>
          <button
            type="button"
            onClick={() => setPage((value) => Math.max(1, value - 1))}
            disabled={page === 1}
            className="rounded-[6px] border border-border bg-card hover:bg-muted px-3 py-1 disabled:opacity-40"
          >
            Previous
          </button>
          <span>
            {page} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
            disabled={page === totalPages}
            className="rounded-[6px] border border-border bg-card hover:bg-muted px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
      {modal === "contact" ? (
        <ContactModal
          initial={editing}
          availableTags={availableTags}
          availableAttributes={availableAttributes}
          onClose={() => {
            setModal(null);
            setEditing(null);
          }}
          onSave={saveContact}
        />
      ) : null}
      {modal === "filter" ? (
        <FilterModal
          tags={tagFilters}
          attributes={attributeFilters}
          availableTags={availableTags}
          availableAttributes={availableAttributes}
          setTags={setTagFilters}
          setAttributes={setAttributeFilters}
          onClose={() => setModal(null)}
          onClear={() => {
            setTagFilters([]);
            setAttributeFilters([]);
            setActiveTags([]);
          }}
          onApply={applyFilters}
        />
      ) : null}
      {modal === "import" ? (
        <ImportModal
          onClose={() => {
            setModal(null);
            fetchContacts();
          }}
          onImported={() => {
            fetchContacts();
          }}
        />
      ) : null}
    </div>
  );
}

export function ContactModal({
  initial,
  availableTags,
  availableAttributes,
  onClose,
  onSave,
}: {
  initial: Contact | null;
  availableTags: {name: string, color: string}[];
  availableAttributes: string[];
  onClose: () => void;
  onSave: (contact: Contact) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [phone, setPhone] = useState(initial?.whatsapp ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [country, setCountry] = useState(initial?.countryCode ?? "91");
  const [tag, setTag] = useState(initial?.tags[0] ?? "");
  const [attributes, setAttributes] = useState<{ id: string; name: string; type: string; value: string }[]>(() => {
    return Object.entries(initial?.attributes ?? {}).map(([key, val]) => ({
      id: Math.random().toString(36).slice(2, 9),
      name: key,
      type: "Text",
      value: val,
    }));
  });
  const valid =
    name.trim().length > 0 && /^\d{7,15}$/.test(phone.replace(/\D/g, ""));
  return (
    <ModalShell
      title={initial ? "Edit Contact" : "Add New Contact"}
      onClose={onClose}
      isProcessing={isSaving}
      loadingText={initial ? "Saving changes..." : "Adding contact..."}
    >
      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-[12px] font-semibold text-slate-700">
            Contact Name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 h-10 w-full rounded-[8px] border border-slate-200 px-3 text-[13px] font-normal"
            />
          </label>
          <label className="text-[12px] font-semibold text-slate-700">
            WhatsApp Number
            <div className="mt-2 flex gap-2">
              <select
                value={country}
                onChange={(event) => setCountry(event.target.value)}
                className="h-10 rounded-[8px] border border-slate-200 bg-white px-2 text-[12px]"
              >
                <option value="91">IN +91</option>
                <option value="1">US +1</option>
                <option value="44">UK +44</option>
              </select>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="9876543210"
                className="h-10 min-w-0 flex-1 rounded-[8px] border border-slate-200 px-3 text-[13px]"
              />
            </div>
          </label>
        </div>
        <label className="block text-[12px] font-semibold text-slate-700">
          Tags (optional)
          <select
            value={tag}
            onChange={(event) => setTag(event.target.value)}
            className="mt-2 h-10 w-full rounded-[8px] border border-slate-200 bg-white px-3 text-[13px] font-normal"
          >
            <option value="">No tag</option>
            {availableTags.map((item) => (
              <option key={item.name} value={item.name}>{item.name}</option>
            ))}
          </select>
        </label>
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="flex items-center gap-2 text-[14px] font-semibold text-slate-700">
              Attributes <span className="font-normal text-slate-500">(optional)</span>
            </h3>
            <button
              type="button"
              onClick={() => setAttributes([...attributes, { id: Math.random().toString(36).slice(2, 9), name: "", type: "Text", value: "" }])}
              className="inline-flex h-8 items-center gap-1.5 rounded-[6px] bg-[#eef0ff] px-3 text-[12px] font-semibold text-[#1B2CC1] hover:bg-[#e0e4ff]"
            >
              <Plus className="h-3.5 w-3.5" /> Add Attribute
            </button>
          </div>
          <div className="space-y-3">
            {attributes.map((attr) => (
              <div key={attr.id} className="rounded-[8px] border border-slate-200 bg-[#f8faff] p-4">
                <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                  <label className="flex-1 text-[11px] font-semibold text-slate-700">
                    Name <span className="text-red-500">*</span>
                    <input
                      value={attr.name}
                      onChange={(e) => setAttributes(attributes.map(a => a.id === attr.id ? { ...a, name: e.target.value } : a))}
                      list="available-attrs"
                      placeholder="Select or create"
                      className="mt-1.5 h-9 w-full rounded-[6px] border border-slate-200 bg-white px-2.5 text-[13px] font-normal focus:border-[#1B2CC1] outline-none"
                    />
                    <datalist id="available-attrs">
                      {availableAttributes.map(a => <option key={a} value={a} />)}
                    </datalist>
                  </label>
                  <label className="w-full sm:w-[120px] text-[11px] font-semibold text-slate-700">
                    Value Type
                    <select
                      value={attr.type}
                      onChange={(e) => setAttributes(attributes.map(a => a.id === attr.id ? { ...a, type: e.target.value } : a))}
                      className="mt-1.5 h-9 w-full rounded-[6px] border border-slate-200 bg-white px-2.5 text-[13px] font-normal focus:border-[#1B2CC1] outline-none"
                    >
                      <option>Text</option>
                      <option>Number</option>
                      <option>Date</option>
                    </select>
                  </label>
                  <label className="flex-1 text-[11px] font-semibold text-slate-700">
                    Value <span className="text-red-500">*</span>
                    <input
                      value={attr.value}
                      onChange={(e) => setAttributes(attributes.map(a => a.id === attr.id ? { ...a, value: e.target.value } : a))}
                      placeholder="Enter value"
                      className="mt-1.5 h-9 w-full rounded-[6px] border border-slate-200 bg-white px-2.5 text-[13px] font-normal focus:border-[#1B2CC1] outline-none"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setAttributes(attributes.filter(a => a.id !== attr.id))}
                    className="mb-1.5 p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-[8px] border border-slate-200 px-4 text-[13px]"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!valid || isSaving}
            onClick={() => {
              setIsSaving(true);
              onSave({
                id: initial?.id ?? ``,
                name: name.trim(),
                countryCode: country,
                whatsapp: phone.replace(/\D/g, ""),
                source: initial?.source ?? "Manual",
                tags: tag ? [tag] : [],
                attributes: attributes.reduce((acc, curr) => {
                  if (curr.name.trim() && curr.value.trim()) {
                    acc[curr.name.trim()] = curr.value.trim();
                  }
                  return acc;
                }, {} as Record<string, string>),
                optedOut: initial?.optedOut ?? false,
                createdAt: initial?.createdAt ?? new Date().toISOString(),
              });
              // Removed setIsSaving(false) because parent handles closing modal or showing error
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] bg-[#1B2CC1] px-4 text-[13px] font-semibold text-white disabled:opacity-40"
          >
            {isSaving ? <><ButtonLoader className="text-white" /> {initial ? "Saving..." : "Adding..."}</> : (initial ? "Save Contact" : "Add Contact")}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

export function ModalShell({
  children,
  title,
  onClose,
  isProcessing,
  loadingText,
}: {
  children: React.ReactNode;
  title: string;
  onClose: () => void;
  isProcessing?: boolean;
  loadingText?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4">
      <div className="relative max-h-[88vh] w-full max-w-[560px] overflow-hidden rounded-[8px] border border-slate-200 bg-white shadow-xl">
        {isProcessing && <OverlayLoader text={loadingText} />}
        <div className="max-h-[88vh] w-full overflow-y-auto p-6">
          <div className="mb-5 flex items-center justify-between">
          <h2 className="text-[21px] font-semibold">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>
        {children}
        </div>
      </div>
    </div>
  );
}

export function FilterModal({
  tags,
  attributes,
  availableTags,
  availableAttributes,
  setTags,
  setAttributes,
  onClose,
  onClear,
  onApply,
}: {
  tags: FilterTag[];
  attributes: AttributeFilter[];
  availableTags: {name: string, color: string}[];
  availableAttributes: string[];
  setTags: (value: FilterTag[]) => void;
  setAttributes: (value: AttributeFilter[]) => void;
  onClose: () => void;
  onClear: () => void;
  onApply: () => void;
}) {
  return (
    <ModalShell title="Filter Contacts" onClose={onClose}>
      <div className="space-y-6">
        <section>
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-[15px] font-semibold">
              <Tag className="h-4 w-4 text-[#1B2CC1]" /> Filter by Tags
            </h3>
            <button
              type="button"
              onClick={() => setTags([...tags, { id: Date.now(), value: "" }])}
              className="text-[12px] font-semibold text-[#1B2CC1]"
            >
              + Add Tag
            </button>
          </div>
          {tags.map((filter) => (
            <div key={filter.id} className="mt-3 flex gap-2">
              <select
                value={filter.value}
                onChange={(event) =>
                  setTags(
                    tags.map((item) =>
                      item.id === filter.id
                        ? { ...item, value: event.target.value }
                        : item,
                    ),
                  )
                }
                className="h-10 flex-1 rounded-[8px] border border-slate-200 bg-white px-3 text-[13px]"
              >
                <option value="">Select tag</option>
                {availableTags.map((tag) => (
                  <option key={tag.name} value={tag.name}>{tag.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() =>
                  setTags(tags.filter((item) => item.id !== filter.id))
                }
                className="h-10 w-10 text-slate-400"
              >
                <Trash2 className="mx-auto h-4 w-4" />
              </button>
            </div>
          ))}
        </section>
        <section>
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-[15px] font-semibold">
              <Filter className="h-4 w-4 text-[#1B2CC1]" /> Filter by Attribute
            </h3>
            <button
              type="button"
              onClick={() =>
                setAttributes([
                  ...attributes,
                  { id: Date.now(), name: "", condition: "Equals", value: "" },
                ])
              }
              className="text-[12px] font-semibold text-[#1B2CC1]"
            >
              + Add Attribute
            </button>
          </div>
          {attributes.map((filter) => (
            <div
              key={filter.id}
              className="mt-3 grid grid-cols-[1fr_1fr_1fr_auto] gap-2"
            >
              <select
                value={filter.name}
                onChange={(event) =>
                  setAttributes(
                    attributes.map((item) =>
                      item.id === filter.id
                        ? { ...item, name: event.target.value }
                        : item,
                    ),
                  )
                }
                className="h-10 rounded-[8px] border border-slate-200 bg-white px-2 text-[12px]"
              >
                <option value="">Name</option>
                {availableAttributes.map((attribute) => (
                  <option key={attribute} value={attribute}>{attribute}</option>
                ))}
              </select>
              <select
                value={filter.condition}
                onChange={(event) =>
                  setAttributes(
                    attributes.map((item) =>
                      item.id === filter.id
                        ? { ...item, condition: event.target.value }
                        : item,
                    ),
                  )
                }
                className="h-10 rounded-[8px] border border-slate-200 bg-white px-2 text-[12px]"
              >
                <option>Equals</option>
                <option>Not Equal</option>
                <option>Contains</option>
                <option>Starts With</option>
                <option>Is Empty</option>
                <option>Is Not Empty</option>
              </select>
              <input
                value={filter.value}
                onChange={(event) =>
                  setAttributes(
                    attributes.map((item) =>
                      item.id === filter.id
                        ? { ...item, value: event.target.value }
                        : item,
                    ),
                  )
                }
                placeholder="Value"
                className="h-10 rounded-[8px] border border-slate-200 px-2 text-[12px]"
              />
              <button
                type="button"
                onClick={() =>
                  setAttributes(
                    attributes.filter((item) => item.id !== filter.id),
                  )
                }
                className="h-10 w-8 text-slate-400"
              >
                <Trash2 className="mx-auto h-4 w-4" />
              </button>
            </div>
          ))}
        </section>
        <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={onClear}
            className="h-10 rounded-[8px] border border-slate-200 px-4 text-[13px]"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-[8px] border border-slate-200 px-4 text-[13px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onApply}
            className="h-10 rounded-[8px] bg-[#1B2CC1] px-4 text-[13px] font-semibold text-white"
          >
            Apply Filter
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

export function ImportModal({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: (contacts: Contact[]) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{imported: number, skipped: number, failed: number} | null>(null);

  const parse = async (text: string) => {
    const { contacts: parsedContacts } = parseContactsCSV(text);
    
    // Add additional fields required by Contacts API
    const contacts = parsedContacts.map(c => ({
      ...c,
      id: '',
      source: "csv_upload",
      tags: [],
      attributes: {}
    }));
      
    setIsImporting(true);
    try {
      const res = await fetch("/api/contacts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: contacts })
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Import failed");
      }
      
      const data = await res.json();
      setImportResult(data);
    } catch (err: any) {
      alert(`Error importing: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };
  const choose = (next?: File) => {
    if (next?.name.toLowerCase().endsWith(".csv")) setFile(next);
  };
  return (
    <ModalShell title="Import Contacts" onClose={onClose} isProcessing={isImporting} loadingText="Importing contacts...">
      <p className="-mt-3 mb-5 text-[13px] text-slate-500">
        Upload a CSV file to add contacts in bulk.
      </p>
      <div className="rounded-[8px] border border-slate-200 bg-[#f8f9fc] p-4 text-[12px] text-slate-600">
        Name, CountryCode, Whatsapp, City
        <br />
        Rahul Sharma, 91, 9876543210, Mumbai
        <button
          type="button"
          onClick={() => {
            const link = document.createElement("a");
            link.href = URL.createObjectURL(
              new Blob(
                [
                  "Name,CountryCode,Whatsapp,City\nRahul Sharma,91,9876543210,Mumbai",
                ],
                { type: "text/csv" },
              ),
            );
            link.download = "contacts-sample.csv";
            link.click();
          }}
          className="mt-3 block font-semibold text-[#1B2CC1]"
        >
          Download Sample CSV
        </button>
      </div>
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event: DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          setDragging(false);
          choose(event.dataTransfer.files[0]);
        }}
        className={`mt-5 rounded-[8px] border-2 border-dashed p-8 text-center ${dragging ? "border-[#1B2CC1] bg-[#f1f4ff]" : "border-slate-300 bg-white"}`}
      >
        <input
          id="contact-import"
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            choose(event.target.files?.[0])
          }
        />
        <FileText className="mx-auto h-8 w-8 text-[#1B2CC1]" />
        <p className="mt-3 text-[13px] font-semibold">
          {file?.name || "Drag and drop CSV here"}
        </p>
        {importResult && (
          <div className="mt-4 bg-emerald-50 text-emerald-800 text-[12px] p-3 rounded-[6px] border border-emerald-200">
            <strong>Import Complete!</strong><br />
            ✅ Imported: {importResult.imported}<br />
            ⏭️ Skipped (Duplicates): {importResult.skipped}<br />
            ❌ Failed: {importResult.failed}
          </div>
        )}
        {!importResult && (
          <label
            htmlFor="contact-import"
            className="mt-3 inline-flex cursor-pointer rounded-[8px] border border-[#1B2CC1] px-4 py-2 text-[12px] font-semibold text-[#1B2CC1]"
          >
            Browse file
          </label>
        )}
      </div>
      {!importResult ? (
        <button
          type="button"
          disabled={!file || isImporting}
          onClick={() => {
            const reader = new FileReader();
            reader.onload = () => parse(String(reader.result));
            reader.readAsText(file as File);
          }}
          className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[8px] bg-[#1B2CC1] text-[13px] font-semibold text-white disabled:opacity-40"
        >
          {isImporting ? <><ButtonLoader className="text-white" /> Importing...</> : "Import Contacts"}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onImported([])}
          className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[8px] bg-slate-900 text-[13px] font-semibold text-white"
        >
          Close
        </button>
      )}
    </ModalShell>
  );
}
