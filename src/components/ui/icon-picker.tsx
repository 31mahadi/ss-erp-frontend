"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils/cn";
import { 
  Search, X, Smile, Building2, Users, FileText, Settings, Shield, BarChart3, 
  Calendar, Mail, Phone, Globe, Database, Lock, Bell, Heart, Star, Zap, 
  Target, Briefcase, Folder, Home, Layout, Package, Truck, CreditCard, 
  DollarSign, PieChart, TrendingUp, Activity, Clock, Map,
  Send, MessageSquare, Image, Book, Award, Gift, 
  ShoppingCart, ShoppingBag, Store, Warehouse, Factory, HardHat, Wrench, 
  Clipboard, Monitor, Printer, Cpu, Server, 
  Key, Unlock, Eye, Filter, Grid, List, Table, 
  Plus, Minus, Check, Edit, Trash2, Copy, Save, 
  Download, Upload, Share, Bookmark, Tag, Tags, Archive, 
  Box, Inbox, RefreshCw, 
  User, UserCircle, UserPlus, UserCheck, Contact,
  File, FileCheck, FolderOpen, FolderPlus, Link, 
  ShieldCheck, QrCode, Barcode, CheckCircle, AlertCircle,
  AlertTriangle, Info, HelpCircle, Hash,
  Receipt, Wallet, BadgeDollarSign, Calculator, ClipboardList,
  ClipboardCheck, FileSpreadsheet, FilePieChart, Layers, 
  Building, Landmark, CircleDollarSign, Banknote, Coins,
  HandCoins, PiggyBank, Scale, Gavel, ScrollText,
  FileSignature, FileBadge, UserCog, UsersRound, Network,
  Workflow, GitBranch, Kanban, ListChecks, ListTodo,
  CalendarDays, CalendarCheck, CalendarClock, Timer, Hourglass,
  Gauge, Percent, TrendingDown, LineChart, AreaChart,
  Presentation, Megaphone, Handshake, BadgeCheck, Medal,
  type LucideIcon
} from "lucide-react";

// ERP-focused emoji categories
const EMOJI_CATEGORIES: Record<string, string[]> = {
  "Business": [
    "💼", "🏢", "🏭", "🏪", "🏬", "📊", "📈", "📉", "💰", "💵", "💳", "🧾",
    "📋", "📁", "📂", "🗂️", "📅", "📆", "🗓️", "📇", "🗃️", "🗄️",
  ],
  "People": [
    "👤", "👥", "🧑‍💼", "👨‍💼", "👩‍💼", "🧑‍🔧", "👨‍🔧", "👩‍🔧", "🧑‍💻", "👨‍💻", "👩‍💻",
    "🧑‍🏫", "👨‍🏫", "👩‍🏫", "🤝", "👋", "✋", "👍", "👎", "✅", "❌",
  ],
  "Finance": [
    "💰", "💵", "💴", "💶", "💷", "💳", "🏦", "🧾", "💹", "📊", "📈", "📉",
    "💎", "🪙", "💲", "🏧", "💸", "🤑",
  ],
  "Operations": [
    "📦", "📫", "📬", "📭", "📮", "🚚", "🚛", "✈️", "🚢", "🏗️", "⚙️", "🔧",
    "🔨", "⛏️", "🛠️", "📐", "📏", "🔩", "⚡", "🔋",
  ],
  "Documents": [
    "📄", "📝", "📃", "📑", "🗒️", "📰", "🗞️", "📓", "📔", "📒", "📕", "📗",
    "📘", "📙", "📚", "✏️", "✒️", "🖊️", "🖋️", "📎", "🖇️", "📌",
  ],
  "Status": [
    "✅", "❌", "⭕", "❗", "❓", "⚠️", "🔴", "🟢", "🟡", "🔵", "⬛", "⬜",
    "🔔", "🔕", "⏰", "⏳", "⌛", "🔒", "🔓", "🔑",
  ],
};

// ERP-focused Lucide icon categories
const LUCIDE_ICONS: Record<string, { name: string; icon: LucideIcon }[]> = {
  "Organization": [
    { name: "Building2", icon: Building2 },
    { name: "Building", icon: Building },
    { name: "Landmark", icon: Landmark },
    { name: "Factory", icon: Factory },
    { name: "Warehouse", icon: Warehouse },
    { name: "Store", icon: Store },
    { name: "Home", icon: Home },
    { name: "Globe", icon: Globe },
    { name: "Network", icon: Network },
    { name: "Workflow", icon: Workflow },
  ],
  "HR & Users": [
    { name: "Users", icon: Users },
    { name: "UsersRound", icon: UsersRound },
    { name: "User", icon: User },
    { name: "UserCircle", icon: UserCircle },
    { name: "UserPlus", icon: UserPlus },
    { name: "UserCheck", icon: UserCheck },
    { name: "UserCog", icon: UserCog },
    { name: "Contact", icon: Contact },
    { name: "Handshake", icon: Handshake },
    { name: "BadgeCheck", icon: BadgeCheck },
  ],
  "Finance": [
    { name: "DollarSign", icon: DollarSign },
    { name: "CircleDollarSign", icon: CircleDollarSign },
    { name: "BadgeDollarSign", icon: BadgeDollarSign },
    { name: "Banknote", icon: Banknote },
    { name: "Coins", icon: Coins },
    { name: "HandCoins", icon: HandCoins },
    { name: "CreditCard", icon: CreditCard },
    { name: "Wallet", icon: Wallet },
    { name: "PiggyBank", icon: PiggyBank },
    { name: "Receipt", icon: Receipt },
    { name: "Calculator", icon: Calculator },
    { name: "Scale", icon: Scale },
  ],
  "Analytics": [
    { name: "BarChart3", icon: BarChart3 },
    { name: "PieChart", icon: PieChart },
    { name: "LineChart", icon: LineChart },
    { name: "AreaChart", icon: AreaChart },
    { name: "TrendingUp", icon: TrendingUp },
    { name: "TrendingDown", icon: TrendingDown },
    { name: "Activity", icon: Activity },
    { name: "Gauge", icon: Gauge },
    { name: "Target", icon: Target },
    { name: "Percent", icon: Percent },
    { name: "Presentation", icon: Presentation },
  ],
  "Documents": [
    { name: "File", icon: File },
    { name: "FileText", icon: FileText },
    { name: "FileCheck", icon: FileCheck },
    { name: "FileSpreadsheet", icon: FileSpreadsheet },
    { name: "FilePieChart", icon: FilePieChart },
    { name: "FileSignature", icon: FileSignature },
    { name: "FileBadge", icon: FileBadge },
    { name: "ScrollText", icon: ScrollText },
    { name: "Clipboard", icon: Clipboard },
    { name: "ClipboardList", icon: ClipboardList },
    { name: "ClipboardCheck", icon: ClipboardCheck },
    { name: "Book", icon: Book },
  ],
  "Folders": [
    { name: "Folder", icon: Folder },
    { name: "FolderOpen", icon: FolderOpen },
    { name: "FolderPlus", icon: FolderPlus },
    { name: "Archive", icon: Archive },
    { name: "Inbox", icon: Inbox },
    { name: "Box", icon: Box },
    { name: "Package", icon: Package },
    { name: "Layers", icon: Layers },
    { name: "Database", icon: Database },
  ],
  "Tasks": [
    { name: "ListChecks", icon: ListChecks },
    { name: "ListTodo", icon: ListTodo },
    { name: "Kanban", icon: Kanban },
    { name: "GitBranch", icon: GitBranch },
    { name: "CheckCircle", icon: CheckCircle },
    { name: "Check", icon: Check },
    { name: "Plus", icon: Plus },
    { name: "Edit", icon: Edit },
    { name: "Trash2", icon: Trash2 },
    { name: "RefreshCw", icon: RefreshCw },
  ],
  "Schedule": [
    { name: "Calendar", icon: Calendar },
    { name: "CalendarDays", icon: CalendarDays },
    { name: "CalendarCheck", icon: CalendarCheck },
    { name: "CalendarClock", icon: CalendarClock },
    { name: "Clock", icon: Clock },
    { name: "Timer", icon: Timer },
    { name: "Hourglass", icon: Hourglass },
    { name: "Zap", icon: Zap },
  ],
  "Commerce": [
    { name: "ShoppingCart", icon: ShoppingCart },
    { name: "ShoppingBag", icon: ShoppingBag },
    { name: "Truck", icon: Truck },
    { name: "Gift", icon: Gift },
    { name: "Tag", icon: Tag },
    { name: "Tags", icon: Tags },
    { name: "Barcode", icon: Barcode },
    { name: "QrCode", icon: QrCode },
  ],
  "Communication": [
    { name: "Mail", icon: Mail },
    { name: "MessageSquare", icon: MessageSquare },
    { name: "Phone", icon: Phone },
    { name: "Send", icon: Send },
    { name: "Bell", icon: Bell },
    { name: "Megaphone", icon: Megaphone },
    { name: "Share", icon: Share },
    { name: "Link", icon: Link },
  ],
  "Security": [
    { name: "Shield", icon: Shield },
    { name: "ShieldCheck", icon: ShieldCheck },
    { name: "Lock", icon: Lock },
    { name: "Unlock", icon: Unlock },
    { name: "Key", icon: Key },
    { name: "Eye", icon: Eye },
    { name: "Gavel", icon: Gavel },
  ],
  "Settings": [
    { name: "Settings", icon: Settings },
    { name: "Wrench", icon: Wrench },
    { name: "HardHat", icon: HardHat },
    { name: "Filter", icon: Filter },
    { name: "Server", icon: Server },
    { name: "Cpu", icon: Cpu },
    { name: "Monitor", icon: Monitor },
    { name: "Printer", icon: Printer },
  ],
  "Layout": [
    { name: "Layout", icon: Layout },
    { name: "Grid", icon: Grid },
    { name: "List", icon: List },
    { name: "Table", icon: Table },
    { name: "Map", icon: Map },
    { name: "Briefcase", icon: Briefcase },
  ],
  "Status": [
    { name: "AlertCircle", icon: AlertCircle },
    { name: "AlertTriangle", icon: AlertTriangle },
    { name: "Info", icon: Info },
    { name: "HelpCircle", icon: HelpCircle },
    { name: "Star", icon: Star },
    { name: "Award", icon: Award },
    { name: "Medal", icon: Medal },
    { name: "Bookmark", icon: Bookmark },
  ],
  "Actions": [
    { name: "Download", icon: Download },
    { name: "Upload", icon: Upload },
    { name: "Save", icon: Save },
    { name: "Copy", icon: Copy },
    { name: "Image", icon: Image },
    { name: "Hash", icon: Hash },
  ],
};

// Flatten all lucide icons for search
const ALL_LUCIDE_ICONS = Object.values(LUCIDE_ICONS).flat();

interface IconPickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function IconPicker({ value, onChange, placeholder = "Select icon", className }: IconPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [activeTab, setActiveTab] = React.useState<"emoji" | "lucide">("emoji");
  const [activeEmojiCategory, setActiveEmojiCategory] = React.useState(Object.keys(EMOJI_CATEGORIES)[0]);
  const [activeLucideCategory, setActiveLucideCategory] = React.useState(Object.keys(LUCIDE_ICONS)[0]);

  const handleSelect = (icon: string) => {
    onChange(icon);
    setOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  // Filter emojis based on search
  const filteredEmojis = React.useMemo(() => {
    if (!search) return EMOJI_CATEGORIES[activeEmojiCategory] || [];
    const allEmojis = Object.values(EMOJI_CATEGORIES).flat();
    return allEmojis.filter((emoji) => emoji.includes(search));
  }, [search, activeEmojiCategory]);

  // Filter lucide icons based on search
  const filteredLucideIcons = React.useMemo(() => {
    if (!search) return LUCIDE_ICONS[activeLucideCategory] || [];
    const searchLower = search.toLowerCase();
    return ALL_LUCIDE_ICONS.filter((icon) => icon.name.toLowerCase().includes(searchLower));
  }, [search, activeLucideCategory]);

  // Check if value is a lucide icon name
  const isLucideIcon = React.useMemo(() => {
    if (!value) return false;
    return ALL_LUCIDE_ICONS.some((icon) => icon.name === value);
  }, [value]);

  // Get lucide icon component
  const getLucideIcon = React.useCallback((name: string) => {
    const found = ALL_LUCIDE_ICONS.find((icon) => icon.name === name);
    return found?.icon || null;
  }, []);

  const SelectedIcon = isLucideIcon && value ? getLucideIcon(value) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-10",
            !value && "text-muted-foreground",
            className
          )}
        >
          <div className="flex items-center gap-2">
            {value ? (
              <>
                {isLucideIcon && SelectedIcon ? (
                  <SelectedIcon className="h-5 w-5" />
                ) : (
                  <span className="text-lg">{value}</span>
                )}
                <span className="text-sm text-muted-foreground">
                  {isLucideIcon ? value : ""}
                </span>
              </>
            ) : (
              <span>{placeholder}</span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {value && (
              <X
                className="h-4 w-4 opacity-50 hover:opacity-100 cursor-pointer"
                onClick={handleClear}
              />
            )}
            <Smile className="h-4 w-4 opacity-50" />
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden p-0">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle>Select Icon</DialogTitle>
        </DialogHeader>
        <div className="px-4 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search icons..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        
        {/* Tab buttons */}
        <div className="flex border-b px-4">
          <button
            onClick={() => setActiveTab("emoji")}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === "emoji" 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            💼 Emoji
          </button>
          <button
            onClick={() => setActiveTab("lucide")}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1",
              activeTab === "lucide" 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <Settings className="h-4 w-4" /> Icons
          </button>
        </div>

        {/* Content */}
        <div className="flex h-[320px]">
          {/* Category sidebar */}
          <div className="w-28 border-r overflow-y-auto p-1 space-y-0.5 flex-shrink-0">
            {activeTab === "emoji" ? (
              Object.keys(EMOJI_CATEGORIES).map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setActiveEmojiCategory(category);
                    setSearch("");
                  }}
                  className={cn(
                    "w-full text-left px-2 py-1.5 text-xs rounded-md transition-colors truncate",
                    activeEmojiCategory === category && !search
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50"
                  )}
                  title={category}
                >
                  {category}
                </button>
              ))
            ) : (
              Object.keys(LUCIDE_ICONS).map((category) => (
                <button
                  key={category}
                  onClick={() => {
                    setActiveLucideCategory(category);
                    setSearch("");
                  }}
                  className={cn(
                    "w-full text-left px-2 py-1.5 text-xs rounded-md transition-colors truncate",
                    activeLucideCategory === category && !search
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50"
                  )}
                  title={category}
                >
                  {category}
                </button>
              ))
            )}
          </div>

          {/* Icons grid */}
          <div className="flex-1 overflow-y-auto p-2">
            {activeTab === "emoji" ? (
              <div className="grid grid-cols-8 gap-1">
                {filteredEmojis.map((emoji, index) => (
                  <button
                    key={`${emoji}-${index}`}
                    onClick={() => handleSelect(emoji)}
                    className={cn(
                      "h-8 w-8 flex items-center justify-center rounded-md text-lg transition-colors hover:bg-accent",
                      value === emoji && "bg-accent ring-2 ring-primary"
                    )}
                  >
                    {emoji}
                  </button>
                ))}
                {filteredEmojis.length === 0 && (
                  <p className="col-span-8 text-center text-sm text-muted-foreground py-4">
                    No emojis found
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-1">
                {filteredLucideIcons.map((iconItem) => {
                  const IconComponent = iconItem.icon;
                  return (
                    <button
                      key={iconItem.name}
                      onClick={() => handleSelect(iconItem.name)}
                      className={cn(
                        "h-10 w-10 flex flex-col items-center justify-center rounded-md transition-colors hover:bg-accent group",
                        value === iconItem.name && "bg-accent ring-2 ring-primary"
                      )}
                      title={iconItem.name}
                    >
                      <IconComponent className="h-5 w-5" />
                    </button>
                  );
                })}
                {filteredLucideIcons.length === 0 && (
                  <p className="col-span-5 text-center text-sm text-muted-foreground py-4">
                    No icons found
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Utility component to render an icon (emoji or lucide) from string
interface IconDisplayProps {
  icon?: string;
  className?: string;
  size?: number;
}

export function IconDisplay({ icon, className, size = 20 }: IconDisplayProps) {
  if (!icon) return null;

  // Check if it's a lucide icon
  const found = ALL_LUCIDE_ICONS.find((i) => i.name === icon);
  if (found) {
    const IconComponent = found.icon;
    return <IconComponent className={className} style={{ width: size, height: size }} />;
  }

  // Otherwise treat as emoji
  return <span className={className} style={{ fontSize: size }}>{icon}</span>;
}
