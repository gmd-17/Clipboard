// use this file to add utility functions related to board groups, such as renaming, changing color, and deleting groups.
// then import and use these functions in the Board component to handle group actions.

// import { useToast } from "../context/ToastContext";

// const { showToast } = useToast();

// export const saveGroupName = async (
//   editingGroupId: string | null,
//   editingGroupName: string,
// ) => {
//   if (!editingGroupId) {
//     return;
//   }

//   const name = editingGroupName.trim();

//   if (!name) {
//     showToast({
//       type: "error",
//       title: "Group name required",
//       description: "Enter a name for the group.",
//     });
//     return;
//   }

//   const group = boardGroups.find((item) => item.id === editingGroupId);

//   if (!group || name === group.name) {
//     cancelEditingGroup();
//     return;
//   }

//   try {
//     await updateGroup(editingGroupId, {
//       name,
//     });

//     showToast({
//       type: "success",
//       title: "Group renamed",
//       description: `Renamed to "${name}"`,
//     });

//     cancelEditingGroup();
//   } catch (error) {
//     console.error("[Board] Failed to rename group:", error);

//     showToast({
//       type: "error",
//       title: "Couldn't rename group",
//       description: "Please try again.",
//     });
//   }
// };

// export const changeGroupColor = async (
//   groupId: string,
//   color: (typeof GROUP_COLORS)[number],
// ) => {
//   const group = boardGroups.find((item) => item.id === groupId);

//   if (!group) {
//     return;
//   }

//   try {
//     await updateGroup(groupId, {
//       color,
//     });

//     setColorPickerGroupId(null);
//     setOpenGroupMenuId(null);

//     showToast({
//       type: "success",
//       title: "Group color updated",
//       description: `Updated "${group.name}" to ${color}.`,
//     });
//   } catch (error) {
//     console.error("[Board] Failed to update group color:", error);

//     showToast({
//       type: "error",
//       title: "Couldn't change group color",
//       description: "Please try again.",
//     });
//   }
// };

// export const handleDeleteGroup = async (
//   group: (typeof boardGroups)[number],
// ) => {
//   const confirmed = window.confirm(
//     `Delete "${group.name}"?\n\nThe cards in this group will be kept and moved to Ungrouped.`,
//   );

//   if (!confirmed) {
//     return;
//   }

//   try {
//     await deleteGroup(group.id);

//     setOpenGroupMenuId(null);
//     setColorPickerGroupId(null);

//     showToast({
//       type: "success",
//       title: "Group deleted",
//       description: `"${group.name}" was deleted. Its cards were kept.`,
//     });
//   } catch (error) {
//     console.error("[Board] Failed to delete group:", error);

//     showToast({
//       type: "error",
//       title: "Couldn't delete group",
//       description: "Please try again.",
//     });
//   }
// };
