import { x as push, N as attr, T as store_get, W as unsubscribe_stores, z as pop, R as ensure_array_like, M as attr_class, P as stringify } from './index-BKfiikQf.js';
import './client-HRCS46UK.js';
import './Connections-D53FXc8x.js';
import { b as isTopAdmin } from './User-DPh8mmLT.js';
import './toaster-DzAsAKEJ.js';
import { p as parseFieldsFromJSON } from './Connection-DRlqdxWD.js';
import { E as ErrorAlert } from './ErrorAlert-MgcOEbFF.js';

function RequiredFieldRow($$payload, $$props) {
  push();
  let {
    field = { label: "", id: "" },
    duplicate = false,
    onsave = () => {
    },
    ondelete = () => {
    }
  } = $$props;
  let label = field.label;
  let id = field.id;
  let dirtyForm = field.id !== id || field.label !== label;
  const newField = field.label === "" || field.id === "";
  let edit = newField;
  $$payload.out += `<div class="flex gap-4 p-3 odd:bg-surface-100-900 even:bg-surface-50-950"${attr("data-testid", `required-field-row-${field.id ? field.id : "new"}`)}><label class="label flex-1"><span>Label:</span> <input type="text"${attr("value", label)}${attr("disabled", !edit, true)} class="input" minlength="1" maxlength="255"/></label> <label class="label flex-1"><span>ID:</span> <input type="text"${attr("value", id)}${attr("disabled", !edit, true)}${attr_class(`input ${stringify(duplicate && "preset-tonal-warning border border-warning-500 border-warning-600-400 focus:border-warning-800-200")}`)} minlength="1" maxlength="255"/></label> <div class="flex-none content-end py-2">`;
  if (edit) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<button type="button" title="Save" data-testid="required-field-save-btn" class="btn-icon-color"${attr("disabled", !label || !id || !dirtyForm, true)}><i class="fa-solid fa-floppy-disk fa-xl"></i> <span class="sr-only">Save</span></button> `;
    if (dirtyForm) {
      $$payload.out += "<!--[-->";
      $$payload.out += `<button type="button" title="Reset and cancel" class="btn-icon-color" data-testid="required-field-reset-btn"><i class="fa-solid fa-arrow-rotate-right fa-xl"></i> <span class="sr-only">Reset and cancel</span></button>`;
    } else if (!newField && !dirtyForm) {
      $$payload.out += "<!--[1-->";
      $$payload.out += `<button type="button" title="Cancel" class="btn-icon-color" data-testid="required-field-cancel-btn"><i class="fa-solid fa-ban fa-xl"></i> <span class="sr-only">Cancel</span></button>`;
    } else {
      $$payload.out += "<!--[!-->";
    }
    $$payload.out += `<!--]-->`;
  } else {
    $$payload.out += "<!--[!-->";
    $$payload.out += `<button type="button" title="Edit" class="btn-icon-color" data-testid="required-field-edit-btn"><i class="fa-solid fa-pen fa-xl"></i> <span class="sr-only">Edit</span></button>`;
  }
  $$payload.out += `<!--]--> <button type="button" title="Delete" class="btn-icon-color" data-testid="required-field-delete-btn"><i class="fa-solid fa-trash fa-xl"></i> <span class="sr-only">Delete</span></button></div></div>`;
  pop();
}
function RequiredFieldsList($$payload, $$props) {
  push();
  var $$store_subs;
  let { fields = "[]", onupdate = () => {
  } } = $$props;
  let fieldList = parseFieldsFromJSON(fields);
  let enableNewField = fieldList.length === 0 || !store_get($$store_subs ??= {}, "$isTopAdmin", isTopAdmin);
  let duplicates = fieldList.filter((checkField) => {
    return fieldList.filter((field) => field !== checkField).filter((field) => field.id === checkField.id).length > 0;
  });
  function hasDuplicate(checkField) {
    return !!duplicates.find((field) => field === checkField);
  }
  function updateFields(fields2) {
    onupdate(JSON.stringify(fields2));
  }
  function saveField(previous, current) {
    const newFields = [...fieldList];
    if (previous.label === "" || previous.id === "") {
      newFields.push(current);
      enableNewField = false;
    } else {
      const fieldIndex = newFields.findIndex((f) => f.label === previous.label && f.id === previous.id);
      if (fieldIndex > -1) {
        newFields[fieldIndex] = current;
      }
    }
    updateFields(newFields);
  }
  function deleteField(field) {
    const newFields = fieldList.filter((f) => f.label !== field.label || f.id !== field.id);
    updateFields(newFields);
  }
  const each_array = ensure_array_like(fieldList);
  $$payload.out += `<fieldset class="border border-surface-300-700"><legend class="px-2 ml-2">Required Fields: <button type="button" class="text-primary-700-300 hover:text-secondary-700-300" aria-label="Add New Field" title="Add New Field" data-testid="required-field-new-btn"${attr("disabled", enableNewField, true)}><i${attr_class(`fa-solid fa-square-plus fa-xl ${stringify(enableNewField ? "opacity-50" : "")}`)}></i></button></legend> `;
  if (enableNewField) {
    $$payload.out += "<!--[-->";
    RequiredFieldRow($$payload, {
      onsave: saveField,
      ondelete: () => enableNewField = false
    });
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <!--[-->`;
  for (let index = 0, $$length = each_array.length; index < $$length; index++) {
    let field = each_array[index];
    RequiredFieldRow($$payload, {
      duplicate: hasDuplicate(field),
      field,
      onsave: saveField,
      ondelete: deleteField
    });
  }
  $$payload.out += `<!--]--> `;
  if (duplicates.length > 0) {
    $$payload.out += "<!--[-->";
    ErrorAlert($$payload, {
      "data-testid": "validation-warn",
      color: "warning",
      children: ($$payload2) => {
        $$payload2.out += `<!---->Fields with the same ID may not function properly.`;
      }
    });
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--></fieldset>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
function ConnectionForm($$payload, $$props) {
  push();
  var $$store_subs;
  let { connection = void 0 } = $$props;
  let label = connection?.label || "";
  let id = connection?.id || "";
  let subPrefix = connection?.subPrefix || "";
  let requiredFields = connection?.requiredFields || "[]";
  function updateRequiredFields(json) {
    requiredFields = json;
  }
  $$payload.out += `<p class="mb-3 text-center">For details on how to set up a Connection, please refer to the <a href="https://pic-sure.gitbook.io/pic-sure-developer-guide/configuring-pic-sure/all-in-one-authentication-configuration#additional-authentication-configuration-option-s" target="_blank" class="anchor">PIC-SURE developer guide</a>.</p> <form><fieldset data-testid="connection-form" class="grid gap-4 my-3"${attr("disabled", !store_get($$store_subs ??= {}, "$isTopAdmin", isTopAdmin), true)}>`;
  if (connection?.uuid) {
    $$payload.out += "<!--[-->";
    $$payload.out += `<label class="label"><span>UUID:</span> <input type="text" class="input"${attr("value", connection?.uuid)}${attr("readonly", true, true)}/></label>`;
  } else {
    $$payload.out += "<!--[!-->";
  }
  $$payload.out += `<!--]--> <label class="label required"><span>Label:</span> <input type="text"${attr("value", label)} class="input" required minlength="1" maxlength="255"/></label> <label class="label required"><span>ID:</span> <input type="text"${attr("value", id)} class="input" required minlength="1" maxlength="255"/></label> <label class="label required"><span>Sub Prefix:</span> <input type="text"${attr("value", subPrefix)} class="input" required minlength="1" maxlength="255"/></label> `;
  RequiredFieldsList($$payload, {
    fields: requiredFields,
    onupdate: updateRequiredFields
  });
  $$payload.out += `<!----> <div class="mt-2"><button type="submit" data-testid="connection-save-btn" class="btn preset-tonal-primary border border-primary-500 hover:preset-filled-primary-500">Save</button> <a href="/admin/configuration" data-testid="connection-cancel-btn" class="btn preset-tonal-secondary border border-secondary-500 hover:preset-filled-secondary-500">Cancel</a></div></fieldset></form>`;
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}

export { ConnectionForm as C };
//# sourceMappingURL=ConnectionForm-B29y2k9c.js.map
