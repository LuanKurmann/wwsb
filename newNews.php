<!DOCTYPE html>
<html>
<head>
  <title>Add Attribute</title>
  <script src="assets/plugins/tinymce/js/tinymce/tinymce.min.js"></script>
  <script>
        tinymce.init({
        selector: 'textarea#desc',
        plugins: 'preview importcss searchreplace autolink autosave save directionality code visualblocks visualchars fullscreen image link media template codesample table charmap pagebreak nonbreaking anchor insertdatetime advlist lists wordcount help charmap quickbars emoticons',
    menubar: 'file edit view insert format tools table help',
    toolbar: 'undo redo | bold italic underline strikethrough | fontfamily fontsize blocks | alignleft aligncenter alignright alignjustify | outdent indent |  numlist bullist | forecolor backcolor removeformat | pagebreak | charmap emoticons | fullscreen  preview save print | insertfile image media template link anchor codesample | ltr rtl',
    toolbar_sticky: true,
    autosave_ask_before_unload: true,
    autosave_interval: '30s',
    autosave_prefix: '{path}{query}-{id}-',
    autosave_restore_when_empty: false,
    autosave_retention: '2m',
    image_advtab: true,
    link_list: [
      { title: 'My page 1', value: 'https://www.codexworld.com' },
      { title: 'My page 2', value: 'http://www.codexqa.com' }
    ],
    image_list: [
      { title: 'My page 1', value: 'https://www.codexworld.com' },
      { title: 'My page 2', value: 'http://www.codexqa.com' }
    ],
    image_class_list: [
      { title: 'None', value: '' },
      { title: 'Some class', value: 'class-name' }
    ],
    importcss_append: true,
    file_picker_callback: (callback, value, meta) => {
      /* Provide file and text for the link dialog */
      if (meta.filetype === 'file') {
        callback('https://www.google.com/logos/google.jpg', { text: 'My text' });
      }
  
      /* Provide image and alt text for the image dialog */
      if (meta.filetype === 'image') {
        callback('https://www.google.com/logos/google.jpg', { alt: 'My alt text' });
      }
  
      /* Provide alternative source and posted for the media dialog */
      if (meta.filetype === 'media') {
        callback('movie.mp4', { source2: 'alt.ogg', poster: 'https://www.google.com/logos/google.jpg' });
      }
    },
    templates: [
      { title: 'New Table', description: 'creates a new table', content: '<div class="mceTmpl"><table width="98%%"  border="0" cellspacing="0" cellpadding="0"><tr><th scope="col"> </th><th scope="col"> </th></tr><tr><td> </td><td> </td></tr></table></div>' },
      { title: 'Starting my story', description: 'A cure for writers block', content: 'Once upon a time...' },
      { title: 'New list with dates', description: 'New List with dates', content: '<div class="mceTmpl"><span class="cdate">cdate</span><br><span class="mdate">mdate</span><h2>My List</h2><ul><li></li><li></li></ul></div>' }
    ],
    template_cdate_format: '[Date Created (CDATE): %m/%d/%Y : %H:%M:%S]',
    template_mdate_format: '[Date Modified (MDATE): %m/%d/%Y : %H:%M:%S]',
    height: 400,
    image_caption: true,
    quickbars_selection_toolbar: 'bold italic | quicklink h2 h3 blockquote quickimage quicktable',
    noneditable_class: 'mceNonEditable',
    toolbar_mode: 'sliding',
    contextmenu: 'link image table',
    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:16px }'
        });
    </script>
</head>
<body>
  <h1>Add Attribute</h1>
  <form action="" method="post">
    <div>
      <label for="type">Type:</label><br>
      <select id="type" name="type">
        <option value="news">News</option>
        <option value="game">Resultat</option>
      </select>
    </div>
    <div>
      <label for="team">Team:</label><br>
      <input type="text" id="team" name="team">
    </div>
    <div>
      <label for="title">Title:</label><br>
      <input type="text" id="title" name="title">
    </div>
    <div>
      <label for="short_desc">Short Description:</label><br>
      <input type="text" id="short_desc" name="short_desc">
    </div>
    <div>
      <label for="desc">Description:</label><br>
      <textarea id="desc" name="desc"></textarea>
    </div>
    <div>
      <input type="submit" value="Add Attribute">
    </div>
  </form>
  <?php
    if ($_POST) {
      $type = $_POST['type'];
      $team = $_POST['team'];
      $title = $_POST['title'];
      $short_desc = $_POST['short_desc'];
      $desc = $_POST['desc'];
      require_once 'database.php';
      $database = new Database();
      $conn = $database->getConnection();
      $database->addAttribute($type, $team, $title, $short_desc, $desc);
      echo "Attribute added successfully.";
    }
    ?>   
    
</body>
</html>
