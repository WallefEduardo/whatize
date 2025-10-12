import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Box, TextField, IconButton, Typography, Tabs, Tab } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Search, Close, AccessTime, SentimentSatisfiedAlt, Pets, Fastfood, SportsSoccer, DirectionsCar, Lightbulb, EmojiSymbols, Flag } from '@mui/icons-material';

// ============= EMOJI DATA =============
// Categorias de emojis organizadas como no WhatsApp
const EMOJI_CATEGORIES = {
  recent: {
    name: 'Recentes',
    icon: AccessTime,
    emojis: [] // Será preenchido dinamicamente
  },
  smileys: {
    name: 'Smileys & Pessoas',
    icon: SentimentSatisfiedAlt,
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '🥸', '😎', '🤓', '🧐', '😕', '😟', '🙁', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁', '👅', '👄', '💋', '👶', '🧒', '👦', '👧', '🧑', '👨', '👩', '🧔', '🧑‍🦰', '👨‍🦰', '👩‍🦰', '🧑‍🦱', '👨‍🦱', '👩‍🦱', '🧑‍🦲', '👨‍🦲', '👩‍🦲', '🧑‍🦳', '👨‍🦳', '👩‍🦳', '🧓', '👴', '👵']
  },
  animals: {
    name: 'Animais & Natureza',
    icon: Pets,
    emojis: ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐽', '🐸', '🐵', '🙈', '🙉', '🙊', '🐒', '🐔', '🐧', '🐦', '🐤', '🐣', '🐥', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷', '🕸', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐕‍🦺', '🐈', '🐓', '🦃', '🦚', '🦜', '🦢', '🦩', '🕊', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿', '🦔', '🌵', '🎄', '🌲', '🌳', '🌴', '🌱', '🌿', '☘️', '🍀', '🎍', '🎋', '🍃', '🍂', '🍁', '🍄', '🌾', '💐', '🌷', '🌹', '🥀', '🌺', '🌸', '🌼', '🌻', '🌞', '🌝', '🌛', '🌜', '🌚', '🌕', '🌖', '🌗', '🌘', '🌑', '🌒', '🌓', '🌔', '🌙', '🌎', '🌍', '🌏', '💫', '⭐', '🌟', '✨', '⚡', '☄️', '💥', '🔥', '🌪', '🌈', '☀️', '🌤', '⛅', '🌥', '☁️', '🌦', '🌧', '⛈', '🌩', '🌨', '❄️', '☃️', '⛄', '🌬', '💨', '💧', '💦', '☔', '☂️', '🌊', '🌫']
  },
  food: {
    name: 'Comida & Bebida',
    icon: Fastfood,
    emojis: ['🍇', '🍈', '🍉', '🍊', '🍋', '🍌', '🍍', '🥭', '🍎', '🍏', '🍐', '🍑', '🍒', '🍓', '🥝', '🍅', '🥥', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶', '🥒', '🥬', '🥦', '🧄', '🧅', '🍄', '🥜', '🌰', '🍞', '🥐', '🥖', '🥨', '🥯', '🥞', '🧇', '🧀', '🍖', '🍗', '🥩', '🥓', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🥙', '🧆', '🥚', '🍳', '🥘', '🍲', '🥣', '🥗', '🍿', '🧈', '🧂', '🥫', '🍱', '🍘', '🍙', '🍚', '🍛', '🍜', '🍝', '🍠', '🍢', '🍣', '🍤', '🍥', '🥮', '🍡', '🥟', '🥠', '🥡', '🦀', '🦞', '🦐', '🦑', '🦪', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯', '🍼', '🥛', '☕', '🍵', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺', '🍻', '🥂', '🥃', '🥤', '🧃', '🧉', '🧊', '🥢', '🍽', '🍴', '🥄', '🔪', '🏺']
  },
  sports: {
    name: 'Atividades',
    icon: SportsSoccer,
    emojis: ['⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🥏', '🎱', '🪀', '🏓', '🏸', '🏒', '🏑', '🥍', '🏏', '🥅', '⛳', '🪁', '🏹', '🎣', '🤿', '🥊', '🥋', '🎽', '🛹', '🛼', '🛷', '⛸', '🥌', '🎿', '⛷', '🏂', '🪂', '🏋️', '🤼', '🤸', '🤺', '⛹️', '🤾', '🏌️', '🏇', '🧘', '🏊', '🤽', '🚣', '🧗', '🚵', '🚴', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖', '🏵', '🎗', '🎫', '🎟', '🎪', '🤹', '🎭', '🩰', '🎨', '🎬', '🎤', '🎧', '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎲', '♟', '🎯', '🎳', '🎮', '🎰', '🧩']
  },
  travel: {
    name: 'Viagens & Lugares',
    icon: DirectionsCar,
    emojis: ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎', '🚓', '🚑', '🚒', '🚐', '🚚', '🚛', '🚜', '🦯', '🦽', '🦼', '🛴', '🚲', '🛵', '🏍', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩', '💺', '🛰', '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛥', '🛳', '⛴', '🚢', '⚓', '⛽', '🚧', '🚦', '🚥', '🚏', '🗺', '🗿', '🗽', '🗼', '🏰', '🏯', '🏟', '🎡', '🎢', '🎠', '⛲', '⛱', '🏖', '🏝', '🏜', '🌋', '⛰', '🏔', '🗻', '🏕', '⛺', '🏠', '🏡', '🏘', '🏚', '🏗', '🏭', '🏢', '🏬', '🏣', '🏤', '🏥', '🏦', '🏨', '🏪', '🏫', '🏩', '💒', '🏛', '⛪', '🕌', '🕍', '🛕', '🕋', '⛩', '🛤', '🛣', '🗾', '🎑', '🏞', '🌅', '🌄', '🌠', '🎇', '🎆', '🌇', '🌆', '🏙', '🌃', '🌌', '🌉', '🌁']
  },
  objects: {
    name: 'Objetos',
    icon: Lightbulb,
    emojis: ['⌚', '📱', '📲', '💻', '⌨️', '🖥', '🖨', '🖱', '🖲', '🕹', '🗜', '💽', '💾', '💿', '📀', '📼', '📷', '📸', '📹', '🎥', '📽', '🎞', '📞', '☎️', '📟', '📠', '📺', '📻', '🎙', '🎚', '🎛', '🧭', '⏱', '⏲', '⏰', '🕰', '⌛', '⏳', '📡', '🔋', '🔌', '💡', '🔦', '🕯', '🪔', '🧯', '🛢', '💸', '💵', '💴', '💶', '💷', '💰', '💳', '💎', '⚖️', '🧰', '🔧', '🔨', '⚒', '🛠', '⛏', '🔩', '⚙️', '🧱', '⛓', '🧲', '🔫', '💣', '🧨', '🪓', '🔪', '🗡', '⚔️', '🛡', '🚬', '⚰️', '⚱️', '🏺', '🔮', '📿', '🧿', '💈', '⚗️', '🔭', '🔬', '🕳', '🩹', '🩺', '💊', '💉', '🩸', '🧬', '🦠', '🧫', '🧪', '🌡', '🧹', '🧺', '🧻', '🚽', '🚰', '🚿', '🛁', '🛀', '🧼', '🪒', '🧽', '🧴', '🛎', '🔑', '🗝', '🚪', '🪑', '🛋', '🛏', '🖼', '🛍', '🧳', '🎒', '🧳', '👓', '🕶', '🥽', '🥼', '🦺', '👔', '👕', '👖', '🧣', '🧤', '🧥', '🧦', '👗', '👘', '🥻', '🩱', '🩲', '🩳', '👙', '👚', '👛', '👜', '👝', '🎒', '👞', '👟', '🥾', '🥿', '👠', '👡', '🩰', '👢', '👑', '👒', '🎩', '🎓', '🧢', '⛑', '📿', '💄', '💍', '💎']
  },
  symbols: {
    name: 'Símbolos',
    icon: EmojiSymbols,
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '🚻', '🚮', '🎦', '📶', '🈁', '🔣', 'ℹ️', '🔤', '🔡', '🔠', '🆖', '🆗', '🆙', '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔢', '#️⃣', '*️⃣', '⏏️', '▶️', '⏸', '⏯', '⏹', '⏺', '⏭', '⏮', '⏩', '⏪', '⏫', '⏬', '◀️', '🔼', '🔽', '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️', '↪️', '↩️', '⤴️', '⤵️', '🔀', '🔁', '🔂', '🔄', '🔃', '🎵', '🎶', '➕', '➖', '➗', '✖️', '♾', '💲', '💱', '™️', '©️', '®️', '〰️', '➰', '➿', '🔚', '🔙', '🔛', '🔝', '🔜', '✔️', '☑️', '🔘', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔺', '🔻', '🔸', '🔹', '🔶', '🔷', '🔳', '🔲', '▪️', '▫️', '◾', '◽', '◼️', '◻️', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛', '⬜', '🟫', '🔈', '🔇', '🔉', '🔊', '🔔', '🔕', '📣', '📢', '👁‍🗨', '💬', '💭', '🗯', '♠️', '♣️', '♥️', '♦️', '🃏', '🎴', '🀄', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛', '🕜', '🕝', '🕞', '🕟', '🕠', '🕡', '🕢', '🕣', '🕤', '🕥', '🕦', '🕧']
  },
  flags: {
    name: 'Bandeiras',
    icon: Flag,
    emojis: ['🏳️', '🏴', '🏁', '🚩', '🏳️‍🌈', '🏳️‍⚧️', '🏴‍☠️', '🇦🇫', '🇦🇽', '🇦🇱', '🇩🇿', '🇦🇸', '🇦🇩', '🇦🇴', '🇦🇮', '🇦🇶', '🇦🇬', '🇦🇷', '🇦🇲', '🇦🇼', '🇦🇺', '🇦🇹', '🇦🇿', '🇧🇸', '🇧🇭', '🇧🇩', '🇧🇧', '🇧🇾', '🇧🇪', '🇧🇿', '🇧🇯', '🇧🇲', '🇧🇹', '🇧🇴', '🇧🇦', '🇧🇼', '🇧🇷', '🇮🇴', '🇻🇬', '🇧🇳', '🇧🇬', '🇧🇫', '🇧🇮', '🇰🇭', '🇨🇲', '🇨🇦', '🇮🇨', '🇨🇻', '🇧🇶', '🇰🇾', '🇨🇫', '🇹🇩', '🇨🇱', '🇨🇳', '🇨🇽', '🇨🇨', '🇨🇴', '🇰🇲', '🇨🇬', '🇨🇩', '🇨🇰', '🇨🇷', '🇨🇮', '🇭🇷', '🇨🇺', '🇨🇼', '🇨🇾', '🇨🇿', '🇩🇰', '🇩🇯', '🇩🇲', '🇩🇴', '🇪🇨', '🇪🇬', '🇸🇻', '🇬🇶', '🇪🇷', '🇪🇪', '🇪🇹', '🇪🇺', '🇫🇰', '🇫🇴', '🇫🇯', '🇫🇮', '🇫🇷', '🇬🇫', '🇵🇫', '🇹🇫', '🇬🇦', '🇬🇲', '🇬🇪', '🇩🇪', '🇬🇭', '🇬🇮', '🇬🇷', '🇬🇱', '🇬🇩', '🇬🇵', '🇬🇺', '🇬🇹', '🇬🇬', '🇬🇳', '🇬🇼', '🇬🇾', '🇭🇹', '🇭🇳', '🇭🇰', '🇭🇺', '🇮🇸', '🇮🇳', '🇮🇩', '🇮🇷', '🇮🇶', '🇮🇪', '🇮🇲', '🇮🇱', '🇮🇹', '🇯🇲', '🇯🇵', '🎌', '🇯🇪', '🇯🇴', '🇰🇿', '🇰🇪', '🇰🇮', '🇽🇰', '🇰🇼', '🇰🇬', '🇱🇦', '🇱🇻', '🇱🇧', '🇱🇸', '🇱🇷', '🇱🇾', '🇱🇮', '🇱🇹', '🇱🇺', '🇲🇴', '🇲🇰', '🇲🇬', '🇲🇼', '🇲🇾', '🇲🇻', '🇲🇱', '🇲🇹', '🇲🇭', '🇲🇶', '🇲🇷', '🇲🇺', '🇾🇹', '🇲🇽', '🇫🇲', '🇲🇩', '🇲🇨', '🇲🇳', '🇲🇪', '🇲🇸', '🇲🇦', '🇲🇿', '🇲🇲', '🇳🇦', '🇳🇷', '🇳🇵', '🇳🇱', '🇳🇨', '🇳🇿', '🇳🇮', '🇳🇪', '🇳🇬', '🇳🇺', '🇳🇫', '🇰🇵', '🇲🇵', '🇳🇴', '🇴🇲', '🇵🇰', '🇵🇼', '🇵🇸', '🇵🇦', '🇵🇬', '🇵🇾', '🇵🇪', '🇵🇭', '🇵🇳', '🇵🇱', '🇵🇹', '🇵🇷', '🇶🇦', '🇷🇪', '🇷🇴', '🇷🇺', '🇷🇼', '🇼🇸', '🇸🇲', '🇸🇹', '🇸🇦', '🇸🇳', '🇷🇸', '🇸🇨', '🇸🇱', '🇸🇬', '🇸🇽', '🇸🇰', '🇸🇮', '🇬🇸', '🇸🇧', '🇸🇴', '🇿🇦', '🇰🇷', '🇸🇸', '🇪🇸', '🇱🇰', '🇧🇱', '🇸🇭', '🇰🇳', '🇱🇨', '🇵🇲', '🇻🇨', '🇸🇩', '🇸🇷', '🇸🇿', '🇸🇪', '🇨🇭', '🇸🇾', '🇹🇼', '🇹🇯', '🇹🇿', '🇹🇭', '🇹🇱', '🇹🇬', '🇹🇰', '🇹🇴', '🇹🇹', '🇹🇳', '🇹🇷', '🇹🇲', '🇹🇨', '🇹🇻', '🇻🇮', '🇺🇬', '🇺🇦', '🇦🇪', '🇬🇧', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', '🏴󠁧󠁢󠁷󠁬󠁳󠁿', '🇺🇸', '🇺🇾', '🇺🇿', '🇻🇺', '🇻🇦', '🇻🇪', '🇻🇳', '🇼🇫', '🇪🇭', '🇾🇪', '🇿🇲', '🇿🇼']
  }
};

const RECENT_EMOJIS_KEY = 'recent_emojis';
const MAX_RECENT = 24;

// ============= STYLED COMPONENTS =============
const PickerContainer = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  maxWidth: '420px',
  height: '450px',
  backgroundColor: '#1f2c33',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
}));

const PickerHeader = styled(Box)(() => ({
  padding: '16px',
  borderBottom: '1px solid #2a3942',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

const SearchContainer = styled(Box)(() => ({
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  backgroundColor: '#2a3942',
  borderRadius: '8px',
  padding: '8px 12px',
  gap: '8px',
}));

const SearchInput = styled(TextField)(() => ({
  flex: 1,
  '& .MuiInputBase-root': {
    color: '#e9edef',
    fontSize: '14px',
    padding: 0,
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none',
  },
  '& input::placeholder': {
    color: '#8696a0',
    opacity: 1,
  },
}));

const CloseButton = styled(IconButton)(() => ({
  color: '#8696a0',
  padding: '4px',
  marginLeft: '8px',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
}));

const CategoryTabs = styled(Tabs)(() => ({
  minHeight: '48px',
  borderBottom: '1px solid #2a3942',
  backgroundColor: '#1f2c33',
  '& .MuiTabs-indicator': {
    backgroundColor: '#00a884',
    height: '3px',
  },
  '& .MuiTabs-scrollButtons': {
    color: '#8696a0',
    '&.Mui-disabled': {
      opacity: 0.3,
    },
  },
}));

const CategoryTab = styled(Tab)(() => ({
  minWidth: '48px',
  minHeight: '48px',
  padding: '8px',
  color: '#8696a0',
  '&.Mui-selected': {
    color: '#00a884',
  },
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  '& .MuiSvgIcon-root': {
    fontSize: '22px',
  },
}));

const EmojisGrid = styled(Box)(() => ({
  flex: 1,
  overflowY: 'auto',
  padding: '12px 16px',
  display: 'grid',
  gridTemplateColumns: 'repeat(8, 1fr)',
  gap: '8px',
  alignContent: 'start',

  '&::-webkit-scrollbar': {
    width: '6px',
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: '#1f2c33',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: '#374248',
    borderRadius: '3px',
    '&:hover': {
      backgroundColor: '#4a5c66',
    },
  },
}));

const EmojiButton = styled(Box)(() => ({
  fontSize: '28px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  aspectRatio: '1',
  borderRadius: '8px',
  transition: 'background-color 0.15s ease, transform 0.1s ease',
  userSelect: 'none',

  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: 'scale(1.15)',
  },

  '&:active': {
    transform: 'scale(0.95)',
  },
}));

const EmptyState = styled(Box)(() => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  color: '#8696a0',
  padding: '20px',
  textAlign: 'center',
  gridColumn: '1 / -1',
}));

// ============= HELPER FUNCTIONS =============
const getRecentEmojis = () => {
  try {
    const stored = localStorage.getItem(RECENT_EMOJIS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Erro ao ler emojis recentes:', error);
    return [];
  }
};

const saveRecentEmoji = (emoji) => {
  try {
    let recents = getRecentEmojis();

    // Remove se já existe
    recents = recents.filter(e => e !== emoji);

    // Adiciona no início
    recents.unshift(emoji);

    // Limita ao máximo
    if (recents.length > MAX_RECENT) {
      recents = recents.slice(0, MAX_RECENT);
    }

    localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(recents));
  } catch (error) {
    console.error('Erro ao salvar emoji recente:', error);
  }
};

/**
 * EmojiPicker - Seletor de emojis completo igual ao WhatsApp
 * @param {boolean} embedded - Se true, não renderiza container/header próprio (usa com EmojiStickerPicker)
 * @param {string} externalSearch - Busca controlada externamente (quando embedded)
 */
const EmojiPicker = ({ onSelectEmoji, onClose, embedded = false, externalSearch = '' }) => {
  const [selectedCategory, setSelectedCategory] = useState('recent');
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const [recentEmojis, setRecentEmojis] = useState([]);

  // Usar busca externa se embedded, senão usar interna
  const searchTerm = embedded ? externalSearch : internalSearchTerm;

  // Carregar emojis recentes
  useEffect(() => {
    setRecentEmojis(getRecentEmojis());
  }, []);

  // Atualizar categoria recente dinamicamente
  const categories = useMemo(() => {
    const cats = { ...EMOJI_CATEGORIES };
    cats.recent.emojis = recentEmojis;
    return cats;
  }, [recentEmojis]);

  // Filtrar emojis pela busca
  const filteredEmojis = useMemo(() => {
    if (searchTerm.trim() === '') {
      return categories[selectedCategory].emojis;
    }

    // Buscar em todas as categorias quando houver busca
    const searchLower = searchTerm.toLowerCase();
    const allEmojis = Object.values(categories)
      .filter(cat => cat.name !== 'Recentes')
      .flatMap(cat => cat.emojis);

    return allEmojis;
  }, [searchTerm, selectedCategory, categories]);

  // Selecionar emoji
  const handleEmojiClick = useCallback((emoji) => {
    saveRecentEmoji(emoji);
    setRecentEmojis(getRecentEmojis()); // Atualizar estado
    onSelectEmoji(emoji);
    onClose();
  }, [onSelectEmoji, onClose]);

  // Mudar categoria
  const handleCategoryChange = useCallback((event, newValue) => {
    setSelectedCategory(newValue);
    setSearchTerm(''); // Limpar busca ao mudar categoria
  }, []);

  const content = (
    <>
      {/* Header com busca (só quando não embedded) */}
      {!embedded && (
        <PickerHeader>
          <SearchContainer>
            <Search sx={{ color: '#8696a0', fontSize: '20px' }} />
            <SearchInput
              placeholder="Pesquisar emojis"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              variant="outlined"
              size="small"
            />
          </SearchContainer>
          <CloseButton onClick={onClose}>
            <Close fontSize="small" />
          </CloseButton>
        </PickerHeader>
      )}

      {/* Abas de categorias */}
      {!searchTerm && (
        <CategoryTabs
          value={selectedCategory}
          onChange={handleCategoryChange}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          {Object.entries(categories).map(([key, category]) => {
            const IconComponent = category.icon;
            return (
              <CategoryTab
                key={key}
                value={key}
                icon={<IconComponent />}
                aria-label={category.name}
              />
            );
          })}
        </CategoryTabs>
      )}

      {/* Grid de emojis */}
      <EmojisGrid>
        {filteredEmojis.length === 0 ? (
          <EmptyState>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {selectedCategory === 'recent' && recentEmojis.length === 0
                ? 'Nenhum emoji recente'
                : 'Nenhum emoji encontrado'}
            </Typography>
            {selectedCategory === 'recent' && recentEmojis.length === 0 && (
              <Typography variant="caption" sx={{ color: '#667781' }}>
                Emojis usados recentemente aparecerão aqui
              </Typography>
            )}
          </EmptyState>
        ) : (
          filteredEmojis.map((emoji, index) => (
            <EmojiButton
              key={`${emoji}-${index}`}
              onClick={() => handleEmojiClick(emoji)}
              title={emoji}
            >
              {emoji}
            </EmojiButton>
          ))
        )}
      </EmojisGrid>
    </>
  );

  // Se embedded, retornar apenas o conteúdo (sem container)
  if (embedded) {
    return content;
  }

  // Se standalone, retornar com container próprio
  return (
    <PickerContainer>
      {content}
    </PickerContainer>
  );
};

export default memo(EmojiPicker);
