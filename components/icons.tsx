/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import {
  Activity,
  Ban,
  Timer,
  Hash,
  ArrowDown,
  ArrowRight,
  Baseline,
  ChevronDown,
  Download,
  Film,
  FileImage,
  Image,
  KeyRound,
  Layers,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
  Tv,
  X,
  Clock,
  Palette,
  Zap,
  History,
  Ghost,
  Smile,
  Cloud,
  Moon,
  Sparkle,
} from 'lucide-react';

const defaultProps = {
  strokeWidth: 1.5,
};

export const PaletteIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Palette {...defaultProps} {...props} />
);

export const ZapIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Zap {...defaultProps} {...props} />
);

export const HistoryIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <History {...defaultProps} {...props} />
);

export const GhostIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Ghost {...defaultProps} {...props} />
);

export const SmileIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Smile {...defaultProps} {...props} />
);

export const CloudIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Cloud {...defaultProps} {...props} />
);

export const MoonIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Moon {...defaultProps} {...props} />
);

export const ClockIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Clock {...defaultProps} {...props} />
);

export const KeyIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <KeyRound {...defaultProps} {...props} />
);

export const ArrowPathIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <RefreshCw {...defaultProps} {...props} />;

export const SparklesIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Sparkles {...defaultProps} {...props} />
);

export const PlusIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Plus {...defaultProps} {...props} />
);

export const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <ChevronDown {...defaultProps} {...props} />;

export const SlidersHorizontalIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <SlidersHorizontal {...defaultProps} {...props} />;

export const ArrowRightIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <ArrowRight {...defaultProps} {...props} />;

export const RectangleStackIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <Layers {...defaultProps} {...props} />;

export const XMarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <X {...defaultProps} {...props} />
);

export const TextModeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Baseline {...defaultProps} {...props} />
);

export const FramesModeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <Image {...defaultProps} {...props} />;

export const ReferencesModeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <Film {...defaultProps} {...props} />;

export const TvIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Tv {...defaultProps} {...props} />
);

export const FilmIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Film {...defaultProps} {...props} />
);

export const DownloadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Download {...defaultProps} {...props} />
);

export const FileImageIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <FileImage {...defaultProps} {...props} />
);

export const ActivityIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Activity {...defaultProps} {...props} />
);

export const BanIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Ban {...defaultProps} {...props} />
);

export const TimerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Timer {...defaultProps} {...props} />
);

export const HashIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <Hash {...defaultProps} {...props} />
);

// This icon had a different stroke width in the original file, so we preserve it.
export const CurvedArrowDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (
  props,
) => <ArrowDown {...props} strokeWidth={3} />;