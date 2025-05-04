window.onload = function() { document.getElementById("real-input").focus(); };

window.addEventListener('DOMContentLoaded', () => {
    window.redirect.SET_USER_CFG_SINGLE("gallery_item_show__type", "");
    localStorage.setItem("gallery_item_show_type", "");
    
    const config = window.userSettings.getConfig();


    if (!localStorage.getItem("gallery_item_show_sorter") && config.gallery_item_show__sorter) {
        localStorage.setItem("gallery_item_show_sorter", config.gallery_item_show__sorter);
    }

    if (!localStorage.getItem("gallery_item_show_order") && config.gallery_item_show__order) {
        localStorage.setItem("gallery_item_show_order", config.gallery_item_show__order);
    }

    if (!localStorage.getItem("gallery_type")) {
        localStorage.setItem("gallery_type", "vertical");
    }

    if (!localStorage.getItem("gallery_view_size")) {
        localStorage.setItem("gallery_view_size", "100");
    }

    

    window.redirect.$receive_filemissing((count) => {
        localStorage.setItem("file_not_found", count);				
        console.log("Missing files detected:", count);
        updateStatusBar();
    });
    
    window.redirect.$receive_dataduplicate((count) => {
        localStorage.setItem("data_duplicate_found", count);
        updateStatusBar();
    });


    window.redirect.$db_PATHverification().then(() => {
        loadTableData();
    });


    const sorter_type = {
        AA: document.querySelector("#sortAscBtn.nav_header_main"),
        AZ: document.querySelector("#sortDescBtn.nav_header_main"),
        DCA: document.querySelector("#sortAscDateCreatedBtn.nav_header_main"),
        DCZ: document.querySelector("#sortDescDateCreatedBtn.nav_header_main"),
        DMA: document.querySelector("#sortAscDateModifiedBtn.nav_header_main"),
        DMZ: document.querySelector("#sortDescDateModifiedBtn.nav_header_main"),
        DAA: document.querySelector("#sortAscDateAddedBtn.nav_header_main"),
        DAZ: document.querySelector("#sortDescDateAddedBtn.nav_header_main"),
        R: document.querySelector("#sortRandBtn.nav_header_main"),
    };

    let sorter = localStorage.getItem("gallery_item_show_sorter") || "file_name";
    const order = localStorage.getItem("gallery_item_show_order") || "asc";

    Object.values(sorter_type).forEach(btn => btn?.classList.remove("active"));

    if (sorter === "fingerprint") {
        sorter = "date_imported";
        localStorage.setItem("gallery_item_show_sorter", "date_imported");
        localStorage.setItem("gallery_item_show_order", "desc");
    }

    switch (true) {
        case order === "random":
            sorter_type.R?.classList.add("active");
            break;

        case sorter === "file_name" && order === "asc":
            sorter_type.AA?.classList.add("active");
            break;
        case sorter === "file_name" && order === "desc":
            sorter_type.AZ?.classList.add("active");
            break;

        case sorter === "date_created" && order === "asc":
            sorter_type.DCA?.classList.add("active");
            break;
        case sorter === "date_created" && order === "desc":
            sorter_type.DCZ?.classList.add("active");
            break;

        case sorter === "date_modified" && order === "asc":
            sorter_type.DMA?.classList.add("active");
            break;
        case sorter === "date_modified" && order === "desc":
            sorter_type.DMZ?.classList.add("active");
            break;

        case sorter === "date_imported" && order === "asc":
            sorter_type.DAA?.classList.add("active");
            break;
            
        case sorter === "date_imported" && order === "desc":
            sorter_type.DAZ?.classList.add("active");
            break;
    }


    const default_key = document.querySelector(".nav_button.control_default");
    const default_untag = document.querySelector(".nav_button.control_untag");
    const showDefault = localStorage.getItem("gallery_item_show_default");
    const showUntag = localStorage.getItem("gallery_item_show_type");
    const errorOnlyBtn = document.getElementById("errorOnly");

    if (showDefault === null || showDefault === "") {
        default_key.classList.toggle(null);
    } else if (showDefault === "active") {
        default_key.classList.toggle("active");
        default_untag.classList.toggle("remove");
    }

    if (showUntag === null || showUntag === "") {
        default_untag.classList.toggle(null);
    } else if (showDefault === "tag_null") {
        default_untag.classList.toggle("active");
        default_key.classList.toggle("remove");
    }

    if (showUntag === "ERR") {
        errorOnlyBtn.classList.add("active");
    }

        
    localStorage.removeItem("current_tag");
    localStorage.removeItem("raw_tag");
    localStorage.removeItem("current_tag_set");
    localStorage.removeItem("raw_tag_set");
    localStorage.removeItem("current_tag_restrict");
    localStorage.removeItem("raw_tag_restrict");
    localStorage.removeItem("current_selection");

});