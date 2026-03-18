## TODO: Implement Zalo-like SideNav

### Status: 🔄 In Progress

**Approved Plan Breakdown:**

1. ✅ **Create SideNav.tsx** - Extract & enhance sidebar as separate component
   - Top: logoLoza.png + title + icons ✓
   - Nav tabs: Chat | Friends | Social ✓
   - Sub-tabs: Tất cả | Đoạn chat | Nhóm chat ✓
   - Conv list + bottom user/edit ✓
   - Top: logoLoza.png + title + icons
   - Nav tabs: Chat (active) | Friends | Social
   - Sub-tabs: Tất cả | Đoạn chat | Nhóm chat
   - Conv list + bottom user/edit
2. 🔄 **Update ChatAppPage.tsx**
   - Integrate <SideNav />
   - Update layout/responsive (hide right on mobile)
   - Change tabs to spec
   - Move logic to SideNav where possible
3. ⏳ **Update App.tsx** - Add /friends, /social routes (placeholders)
4. ⏳ **CSS tweaks** - Distinct navbar styling
5. ✅ **Test** - npm run dev, check responsive

**Next step:** Update ChatAppPage.tsx to integrate SideNav
